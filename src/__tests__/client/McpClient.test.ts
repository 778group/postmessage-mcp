/**
 * McpClient 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpClient } from "../../lib/client/McpClient.js";

describe("McpClient", () => {
  let client: McpClient;

  beforeEach(() => {
    client = new McpClient({ name: "test-client", version: "1.0.0" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 状态管理
  // -----------------------------------------------------------------------
  describe("state", () => {
    it("初始状态为 disconnected", () => {
      expect(client.getState()).toBe("disconnected");
    });

    it("未连接时 getServerInfo 返回 null", () => {
      expect(client.getServerInfo()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 未连接时的操作
  // -----------------------------------------------------------------------
  describe("未连接时的操作", () => {
    it("listTools 抛出错误", async () => {
      await expect(client.listTools()).rejects.toThrow("未连接");
    });

    it("callTool 抛出错误", async () => {
      await expect(client.callTool("greet", {})).rejects.toThrow("未连接");
    });

    it("listResources 抛出错误", async () => {
      await expect(client.listResources()).rejects.toThrow("未连接");
    });

    it("readResource 抛出错误", async () => {
      await expect(client.readResource("file:///test")).rejects.toThrow("未连接");
    });

    it("listPrompts 抛出错误", async () => {
      await expect(client.listPrompts()).rejects.toThrow("未连接");
    });

    it("getPrompt 抛出错误", async () => {
      await expect(client.getPrompt("greeting")).rejects.toThrow("未连接");
    });

    it("ping 抛出错误", async () => {
      await expect(client.ping()).rejects.toThrow("未连接");
    });

    it("disconnect 未连接时不报错", async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
      expect(client.getState()).toBe("disconnected");
    });
  });
});
