import { useRef } from "react";
import App from "./App.tsx";
import "./App.css";

/**
 * Demo 演示页面 - 全屏左右分栏布局
 * 左侧: Server 端
 * 右侧: Client 端 (iframe)
 */
function DemoApp() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="demo-container">
      {/* 左右分栏布局 */}
      <div className="split-layout">
        {/* 左侧 Server 端 */}
        <div className="split-panel server-panel">
          <App iframeRef={iframeRef} />
        </div>

        {/* 右侧 Client 端 iframe */}
        <div className="split-panel iframe-panel">
          <iframe
            ref={iframeRef}
            src="/client.html"
            title="MCP Client"
            className="client-iframe"
          />
        </div>
      </div>
    </div>
  );
}

export default DemoApp;
