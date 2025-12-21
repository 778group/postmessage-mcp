import { useState } from "react";
import { useMcpClient } from "./lib";
import "./App.css";

/**
 * MCP Client 示例页面
 * 作为 iframe 页面，调用主页面的 MCP Server 能力
 */
function ClientApp() {
  const {
    connect,
    isConnected,
    error,
    serverInfo,
    tools,
    resources,
    prompts,
    callTool,
    readResource,
    getPrompt,
  } = useMcpClient({
    name: "demo-client",
    version: "1.0.0",
    autoConnect: true,
    autoFetch: true,
  });

  const [result, setResult] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // 计算器表单状态
  const [calcOp, setCalcOp] = useState("add");
  const [calcA, setCalcA] = useState("10");
  const [calcB, setCalcB] = useState("5");

  // Prompt 表单状态
  const [promptName, setPromptName] = useState("张三");
  const [promptStyle, setPromptStyle] = useState("casual");

  const handleCallCalculator = async () => {
    setLoading(true);
    setIsError(false);
    try {
      const res = await callTool("calculator", {
        operation: calcOp,
        a: parseFloat(calcA),
        b: parseFloat(calcB),
      });
      setResult(JSON.stringify(res, null, 2));
      setIsError(res.isError ?? false);
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCallGetTime = async () => {
    setLoading(true);
    setIsError(false);
    try {
      const res = await callTool("get_time", { format: "full" });
      setResult(JSON.stringify(res, null, 2));
      setIsError(res.isError ?? false);
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReadResource = async () => {
    setLoading(true);
    setIsError(false);
    try {
      const res = await readResource("demo://config");
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGetPrompt = async () => {
    setLoading(true);
    setIsError(false);
    try {
      const res = await getPrompt("greeting", {
        name: promptName,
        style: promptStyle,
      });
      setResult(JSON.stringify(res, null, 2));
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-app">
      <header className="client-header">
        <h1>💻 Client 端 （从 Server 端打开的 iframe）</h1>
        <div className="client-status">
          {isConnected ? (
            <span className="connected">● 已连接</span>
          ) : (
            <span className="disconnected">● 未连接</span>
          )}
          <button onClick={connect} className="connect-btn">
            重新连接
          </button>
        </div>
        {serverInfo && (
          <div className="server-info">
            服务器: {serverInfo.name} v{serverInfo.version}
          </div>
        )}
        {error && <div className="error-message">错误: {error.message}</div>}
      </header>

      <div className="client-content">
        {/* 左侧：功能区域 */}
        <div className="client-left">
          {/* 工具区域 */}
          <div className="client-section">
            <h2>🔧 工具 ({tools.length})</h2>
            <ul className="items-list">
              {tools.map((tool) => (
                <li key={tool.name}>
                  <strong>{tool.name}</strong> - {tool.description}
                </li>
              ))}
            </ul>

            <div className="tool-form">
              <h3>调用计算器</h3>
              <select
                value={calcOp}
                onChange={(e) => setCalcOp(e.target.value)}
              >
                <option value="add">加法 (+)</option>
                <option value="subtract">减法 (-)</option>
                <option value="multiply">乘法 (×)</option>
                <option value="divide">除法 (÷)</option>
              </select>
              <div className="input-row">
                <input
                  type="number"
                  value={calcA}
                  onChange={(e) => setCalcA(e.target.value)}
                  placeholder="数字 A"
                />
                <input
                  type="number"
                  value={calcB}
                  onChange={(e) => setCalcB(e.target.value)}
                  placeholder="数字 B"
                />
              </div>
              <button
                onClick={handleCallCalculator}
                disabled={loading || !isConnected}
              >
                {loading ? "执行中..." : "执行计算"}
              </button>
            </div>

            <div className="tool-form">
              <h3>获取时间</h3>
              <button
                onClick={handleCallGetTime}
                disabled={loading || !isConnected}
              >
                {loading ? "获取中..." : "获取当前时间"}
              </button>
            </div>
          </div>

          {/* 资源区域 */}
          <div className="client-section">
            <h2>📁 资源 ({resources.length})</h2>
            <ul className="items-list">
              {resources.map((resource) => (
                <li key={resource.uri}>
                  <strong>{resource.uri}</strong> - {resource.name}
                </li>
              ))}
            </ul>
            <button
              onClick={handleReadResource}
              disabled={loading || !isConnected}
              className="action-btn"
            >
              {loading ? "读取中..." : "读取配置资源"}
            </button>
          </div>

          {/* Prompts 区域 */}
          <div className="client-section">
            <h2>💬 Prompts ({prompts.length})</h2>
            <ul className="items-list">
              {prompts.map((prompt) => (
                <li key={prompt.name}>
                  <strong>{prompt.name}</strong> - {prompt.description}
                </li>
              ))}
            </ul>
            <div className="tool-form">
              <h3>获取问候语</h3>
              <input
                type="text"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="输入名称"
              />
              <select
                value={promptStyle}
                onChange={(e) => setPromptStyle(e.target.value)}
              >
                <option value="casual">随意</option>
                <option value="formal">正式</option>
              </select>
              <button
                onClick={handleGetPrompt}
                disabled={loading || !isConnected}
              >
                {loading ? "获取中..." : "获取问候语"}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：执行结果 */}
        <div className="client-right">
          <div className="client-section result-section">
            <h2>📋 执行结果</h2>
            {result ? (
              <pre className={`result-box ${isError ? "error" : ""}`}>
                {result}
              </pre>
            ) : (
              <div className="empty-result">暂无执行结果</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientApp;
