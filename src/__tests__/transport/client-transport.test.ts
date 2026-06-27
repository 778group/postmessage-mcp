/**
 * PostMessageClientTransport 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PostMessageClientTransport } from "../../lib/transport/client-transport.js";
import { MCP_MESSAGE_EVENT, MCP_READY_ACK_EVENT } from "../../lib/transport/types.js";

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------
function dispatchMessage(data: unknown, overrides: Partial<MessageEventInit> = {}) {
  const event = new MessageEvent("message", {
    data: {
      type: MCP_MESSAGE_EVENT,
      data,
    },
    origin: overrides.origin ?? "https://trusted.com",
    source: overrides.source ?? window,
    ...overrides,
  });
  window.dispatchEvent(event);
}

describe("PostMessageClientTransport", () => {
  // jsdom 默认 window.parent === window，需 mock
  const originalParent = Object.getOwnPropertyDescriptor(window, "parent");

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 构造与 start
  // -----------------------------------------------------------------------
  describe("constructor & start", () => {
    it("默认模式不在 iframe 中会抛出错误", async () => {
      const t = new PostMessageClientTransport();
      await expect(t.start()).rejects.toThrow("必须在 iframe 中运行");
    });

    it("start 发送 ready 消息", async () => {
      // 模拟在 iframe 中
      const fakeParent = { postMessage: vi.fn() } as unknown as Window;
      Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });

      const t = new PostMessageClientTransport();
      await t.start();

      expect(fakeParent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MCP_MESSAGE_EVENT,
          data: expect.objectContaining({ method: "__mcp_ready__" }),
        }),
        "*",
      );
    });

    it("重复 start 不重复发送", async () => {
      const fakeParent = { postMessage: vi.fn() } as unknown as Window;
      Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });

      const t = new PostMessageClientTransport();
      await t.start();
      await t.start();
      expect(fakeParent.postMessage).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // waitForReady
  // -----------------------------------------------------------------------
  describe("waitForReady", () => {
    it("收到 ack 后 resolve", async () => {
      const fakeParent = { postMessage: vi.fn() } as unknown as Window;
      Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });

      const t = new PostMessageClientTransport();

      const readyPromise = t.waitForReady();

      // 模拟收到 ack（source 为 parent window）
      dispatchMessage(
        { method: MCP_READY_ACK_EVENT },
        { source: fakeParent },
      );

      await expect(readyPromise).resolves.toBeUndefined();
    });

    it("超时后 reject", async () => {
      const t = new PostMessageClientTransport();
      await expect(t.waitForReady(100)).rejects.toThrow("握手超时");
    });
  });

  // -----------------------------------------------------------------------
  // send
  // -----------------------------------------------------------------------
  describe("send", () => {
    it("未 start 时 send 抛出错误", async () => {
      const t = new PostMessageClientTransport();
      await expect(t.send({ jsonrpc: "2.0", method: "ping" })).rejects.toThrow(
        "Transport 未启动",
      );
    });

    it("start 后 send 正常发送", async () => {
      const fakeParent = { postMessage: vi.fn() } as unknown as Window;
      Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });

      const t = new PostMessageClientTransport();
      await t.start();

      await t.send({ jsonrpc: "2.0", id: 1, method: "ping" });

      expect(fakeParent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MCP_MESSAGE_EVENT,
          data: { jsonrpc: "2.0", id: 1, method: "ping" },
        }),
        "*",
      );
    });
  });

  // -----------------------------------------------------------------------
  // close
  // -----------------------------------------------------------------------
  describe("close", () => {
    it("close 清理状态", async () => {
      const fakeParent = { postMessage: vi.fn() } as unknown as Window;
      Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });

      const t = new PostMessageClientTransport();
      await t.start();
      await t.close();

      await expect(t.send({ jsonrpc: "2.0", method: "ping" })).rejects.toThrow(
        "Transport 未启动",
      );
    });

    it("close 触发 onclose 回调", async () => {
      const onclose = vi.fn();
      const t = new PostMessageClientTransport({ parent: window } as any);
      t.onclose = onclose;

      await t.close();
      expect(onclose).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // 消息转发
  // -----------------------------------------------------------------------
  describe("消息转发", () => {
    it("握手消息不转发给 onmessage", async () => {
      const fakeParent = { postMessage: vi.fn() } as unknown as Window;
      Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });

      const t = new PostMessageClientTransport();
      const onmessage = vi.fn();
      t.onmessage = onmessage;
      await t.start();

      // 握手消息
      dispatchMessage(
        { method: MCP_READY_ACK_EVENT },
        { source: fakeParent },
      );
      expect(onmessage).not.toHaveBeenCalled();

      // 普通消息
      dispatchMessage(
        { jsonrpc: "2.0", id: 1, result: { ok: true } },
        { source: fakeParent },
      );
      expect(onmessage).toHaveBeenCalledTimes(1);
    });
  });
});
