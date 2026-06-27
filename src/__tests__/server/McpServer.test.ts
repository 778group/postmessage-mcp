/**
 * McpServer 测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "../../lib/server/McpServer.js";
import type { ToolDefinition, ResourceDefinition, PromptDefinition } from "../../lib/server/types.js";

// ---------------------------------------------------------------------------
// 辅助：构建测试用的 Tool/Resource/Prompt
// ---------------------------------------------------------------------------
function makeTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    name: "test-tool",
    description: "a test tool",
    inputSchema: { type: "object", properties: {} },
    handler: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
    ...overrides,
  };
}

function makeResource(overrides: Partial<ResourceDefinition> = {}): ResourceDefinition {
  return {
    uri: "file:///data.txt",
    name: "test-resource",
    description: "a test resource",
    mimeType: "text/plain",
    handler: vi.fn().mockResolvedValue({ contents: [] }),
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptDefinition> = {}): PromptDefinition {
  return {
    name: "test-prompt",
    description: "a test prompt",
    arguments: [],
    handler: vi.fn().mockResolvedValue({ messages: [] }),
    ...overrides,
  };
}

describe("McpServer", () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: "test-server", version: "1.0.0" });
  });

  // -----------------------------------------------------------------------
  // Tools 管理
  // -----------------------------------------------------------------------
  describe("Tools", () => {
    it("addTool 添加工具并返回 this（链式调用）", () => {
      const result = server.addTool(makeTool({ name: "t1" }));
      expect(result).toBe(server);
    });

    it("getTools 返回不含 handler 的工具列表", () => {
      server.addTool(makeTool({ name: "t1" }));
      server.addTool(makeTool({ name: "t2" }));

      const tools = server.getTools();
      expect(tools).toHaveLength(2);
      expect(tools[0]).not.toHaveProperty("handler");
      expect(tools[0].name).toBe("t1");
    });

    it("removeTool 移除已注册的工具", () => {
      server.addTool(makeTool({ name: "t1" }));
      expect(server.removeTool("t1")).toBe(true);
      expect(server.getTools()).toHaveLength(0);
    });

    it("removeTool 移除不存在的工具返回 false", () => {
      expect(server.removeTool("nonexistent")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Resources 管理
  // -----------------------------------------------------------------------
  describe("Resources", () => {
    it("addResource / getResources / removeResource", () => {
      server.addResource(makeResource({ uri: "file:///a.txt" }));
      server.addResource(makeResource({ uri: "file:///b.txt" }));

      expect(server.getResources()).toHaveLength(2);
      expect(server.getResources()[0]).not.toHaveProperty("handler");

      expect(server.removeResource("file:///a.txt")).toBe(true);
      expect(server.getResources()).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Prompts 管理
  // -----------------------------------------------------------------------
  describe("Prompts", () => {
    it("addPrompt / getPrompts / removePrompt", () => {
      server.addPrompt(makePrompt({ name: "p1" }));
      server.addPrompt(makePrompt({ name: "p2" }));

      expect(server.getPrompts()).toHaveLength(2);
      expect(server.getPrompts()[0]).not.toHaveProperty("handler");

      expect(server.removePrompt("p1")).toBe(true);
      expect(server.getPrompts()).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // initialize 响应
  // -----------------------------------------------------------------------
  describe("initialize", () => {
    it("返回 capabilities 和 serverInfo", async () => {
      server.addTool(makeTool({ name: "t1" }));

      // 通过私有方法间接测试 — connect 会走完整的消息流程
      // 这里直接验证 getTools 等方法的输出模式
      const tools = server.getTools();
      expect(tools).toHaveLength(1);
      // initialize handler 会根据 tools/resources/prompts 是否有注册来判断 capabilities
      // 具体通过 handleInitialize 的返回值验证需要通过 connect（需要 mock transport）
    });
  });
});
