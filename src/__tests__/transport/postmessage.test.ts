/**
 * postmessage 工具函数测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isOriginAllowed,
  createPostMessageListener,
  isReadyHandshake,
  createReadyMessage,
} from "../../lib/transport/postmessage.js";
import { MCP_MESSAGE_EVENT } from "../../lib/transport/types.js";

// ---------------------------------------------------------------------------
// isOriginAllowed
// ---------------------------------------------------------------------------
describe("isOriginAllowed", () => {
  it("不传 allowedOrigins 或传空数组时返回 true", () => {
    expect(isOriginAllowed("https://evil.com")).toBe(true);
    expect(isOriginAllowed("https://evil.com", [])).toBe(true);
  });

  it("精确匹配", () => {
    const allowed = ["https://example.com", "https://other.io"];
    expect(isOriginAllowed("https://example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://other.io", allowed)).toBe(true);
    expect(isOriginAllowed("https://evil.com", allowed)).toBe(false);
  });

  it("通配符匹配 (*.example.com)", () => {
    const allowed = ["*.example.com"];
    expect(isOriginAllowed("https://sub.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://deep.nested.example.com", allowed)).toBe(
      true,
    );
    // 精确域名本身也应匹配
    expect(isOriginAllowed("https://example.com", allowed)).toBe(true);
  });

  it("通配符不会误匹配其他域名后缀", () => {
    const allowed = ["*.example.com"];
    // notexample.com 不应匹配 *.example.com
    expect(isOriginAllowed("https://notexample.com", allowed)).toBe(false);
    expect(isOriginAllowed("https://example.com.evil.com", allowed)).toBe(
      false,
    );
  });

  it("带协议的通配符匹配 (https://*.example.com)", () => {
    const allowed = ["https://*.example.com"];
    expect(isOriginAllowed("https://sub.example.com", allowed)).toBe(true);
    // http 不匹配
    expect(isOriginAllowed("http://sub.example.com", allowed)).toBe(false);
  });

  it("带端口的 origin 的正配符匹配", () => {
    const allowed = ["*.example.com"];
    expect(isOriginAllowed("https://sub.example.com:3000", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:5173", ["*.localhost"])).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// isReadyHandshake
// ---------------------------------------------------------------------------
describe("isReadyHandshake", () => {
  it("识别 __mcp_ready__", () => {
    expect(isReadyHandshake({ method: "__mcp_ready__" })).toBe(true);
  });

  it("识别 __mcp_ready_ack__", () => {
    expect(isReadyHandshake({ method: "__mcp_ready_ack__" })).toBe(true);
  });

  it("拒绝普通消息", () => {
    expect(isReadyHandshake({ method: "tools/list" })).toBe(false);
    expect(isReadyHandshake({ result: "ok" })).toBe(false);
    expect(isReadyHandshake(null)).toBe(false);
    expect(isReadyHandshake(undefined)).toBe(false);
    expect(isReadyHandshake("string")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createReadyMessage
// ---------------------------------------------------------------------------
describe("createReadyMessage", () => {
  it("创建正确的 structure", () => {
    const msg = createReadyMessage("__mcp_ready__");
    expect(msg.jsonrpc).toBe("2.0");
    expect(msg.method).toBe("__mcp_ready__");
    expect(msg.params).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// createPostMessageListener
// ---------------------------------------------------------------------------
describe("createPostMessageListener", () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, "addEventListener");
    removeSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  function dispatchMessage(data: unknown, overrides: Partial<MessageEventInit> = {}) {
    const event = new MessageEvent("message", {
      data,
      origin: overrides.origin ?? "https://trusted.com",
      source: overrides.source ?? window,
      ...overrides,
    });
    window.dispatchEvent(event);
  }

  it("注册和取消监听", () => {
    const listener = createPostMessageListener(null, undefined, () => {});
    expect(addSpy).toHaveBeenCalledWith("message", expect.any(Function));

    listener.cancel();
    expect(removeSpy).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("只处理 type 为 mcp-message 的消息", () => {
    const onMessage = vi.fn();
    createPostMessageListener(null, undefined, onMessage);

    dispatchMessage({ type: "other", data: "hello" });
    expect(onMessage).not.toHaveBeenCalled();

    dispatchMessage({ type: MCP_MESSAGE_EVENT, data: { method: "ping" } });
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(
      { method: "ping" },
      expect.any(MessageEvent),
    );
  });

  it("校验 targetWindow source", () => {
    const onMessage = vi.fn();
    const iframe = { postMessage: vi.fn() } as unknown as Window;

    createPostMessageListener(iframe, undefined, onMessage);

    // source 不匹配
    dispatchMessage(
      { type: MCP_MESSAGE_EVENT, data: { method: "ping" } },
      { source: window },
    );
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("校验 origin 白名单，拒绝未授权域名", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onMessage = vi.fn();

    createPostMessageListener(null, ["https://trusted.com"], onMessage);

    // 授权域名
    dispatchMessage(
      { type: MCP_MESSAGE_EVENT, data: { method: "ping" } },
      { origin: "https://trusted.com" },
    );
    expect(onMessage).toHaveBeenCalledTimes(1);

    // 未授权域名
    dispatchMessage(
      { type: MCP_MESSAGE_EVENT, data: { method: "ping" } },
      { origin: "https://evil.com" },
    );
    expect(onMessage).toHaveBeenCalledTimes(1); // 没有增加
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("拒绝来自未授权域名的消息"),
    );

    warnSpy.mockRestore();
  });

  it("拒绝超过 1 MiB 的超大消息", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onMessage = vi.fn();

    createPostMessageListener(null, undefined, onMessage);

    // 构造接近 1 MiB 的数据
    const largeData = {
      type: MCP_MESSAGE_EVENT,
      data: { payload: "x".repeat(1024 * 1024) },
    };

    dispatchMessage(largeData);
    expect(onMessage).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("拒绝超大 postMessage"),
    );

    warnSpy.mockRestore();
  });
});
