/**
 * PostMessageServerTransport 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PostMessageServerTransport } from "../../lib/transport/server-transport.js";
import { MCP_MESSAGE_EVENT, MCP_READY_EVENT } from "../../lib/transport/types.js";

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

describe("PostMessageServerTransport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 握手处理
  // -----------------------------------------------------------------------
  describe("handshake", () => {
    it("收到 ready 后回复 ack 到正确的 source", async () => {
      const fakeClient = { postMessage: vi.fn() } as unknown as Window;
      const t = new PostMessageServerTransport({
        target: window,
      });

      dispatchMessage(
        { method: MCP_READY_EVENT },
        { source: fakeClient, origin: "https://trusted.com" },
      );

      expect(fakeClient.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MCP_MESSAGE_EVENT,
          data: expect.objectContaining({ method: "__mcp_ready_ack__" }),
        }),
        "https://trusted.com",
      );
    });

    it("null origin 时使用 '*' 并输出警告", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const fakeClient = { postMessage: vi.fn() } as unknown as Window;
      const t = new PostMessageServerTransport({
        target: window,
      });

      dispatchMessage(
        { method: MCP_READY_EVENT },
        { source: fakeClient, origin: "null" },
      );

      expect(fakeClient.postMessage).toHaveBeenCalledWith(
        expect.anything(),
        "*",
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("null origin"),
      );

      warnSpy.mockRestore();
    });

    it("握手后 waitForReady 立即 resolve", async () => {
      const t = new PostMessageServerTransport({ target: window });

      dispatchMessage(
        { method: MCP_READY_EVENT },
        { source: window },
      );

      await expect(t.waitForReady()).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // waitForReady 超时
  // -----------------------------------------------------------------------
  describe("waitForReady timeout", () => {
    it("超时后 reject", async () => {
      const t = new PostMessageServerTransport({ target: window });
      await expect(t.waitForReady(100)).rejects.toThrow("握手超时");
    });
  });

  // -----------------------------------------------------------------------
  // clientWindow 锁定
  // -----------------------------------------------------------------------
  describe("clientWindow pinning", () => {
    it("握手后仅接受来自握手窗口的消息", async () => {
      const fakeClient = { postMessage: vi.fn() } as unknown as Window;
      const fakeOther = {} as Window;
      const onmessage = vi.fn();

      const t = new PostMessageServerTransport({ target: window });
      t.onmessage = onmessage;

      // 握手
      dispatchMessage(
        { method: MCP_READY_EVENT },
        { source: fakeClient },
      );
      await t.start();
      await t.waitForReady();

      // 来自握手窗口的消息正常转发
      dispatchMessage(
        { jsonrpc: "2.0", id: 1, method: "tools/list" },
        { source: fakeClient },
      );
      expect(onmessage).toHaveBeenCalledTimes(1);

      // 来自其他窗口的消息被丢弃
      dispatchMessage(
        { jsonrpc: "2.0", id: 2, method: "tools/call" },
        { source: fakeOther },
      );
      expect(onmessage).toHaveBeenCalledTimes(1); // 未增加
    });
  });

  // -----------------------------------------------------------------------
  // start & send
  // -----------------------------------------------------------------------
  describe("start & send", () => {
    it("start 向 target 发送 ready", async () => {
      const fakeIframe = { postMessage: vi.fn() } as unknown as Window;
      const t = new PostMessageServerTransport({ target: fakeIframe });

      await t.start();
      expect(fakeIframe.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MCP_MESSAGE_EVENT,
          data: expect.objectContaining({ method: "__mcp_ready__" }),
        }),
        "*",
      );
    });

    it("send 在未 start 时抛出错误", async () => {
      const t = new PostMessageServerTransport({ target: window });
      await expect(
        t.send({ jsonrpc: "2.0", method: "ping" }),
      ).rejects.toThrow("Transport 未启动");
    });
  });

  // -----------------------------------------------------------------------
  // close
  // -----------------------------------------------------------------------
  describe("close", () => {
    it("close 清理状态并触发 onclose", async () => {
      const fakeClient = { postMessage: vi.fn() } as unknown as Window;
      const onclose = vi.fn();
      const t = new PostMessageServerTransport({ target: fakeClient });
      t.onclose = onclose;

      // 握手后记录 clientWindow
      dispatchMessage(
        { method: MCP_READY_EVENT },
        { source: fakeClient },
      );
      await t.start();

      await t.close();
      expect(onclose).toHaveBeenCalledTimes(1);

      // close 后 send 抛出错误
      await expect(
        t.send({ jsonrpc: "2.0", method: "ping" }),
      ).rejects.toThrow("Transport 未启动");
    });
  });
});
