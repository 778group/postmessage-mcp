import { createRoot } from "react-dom/client";
import "./client.css";
import "./App.css";
import ClientApp from "./ClientApp.tsx";

createRoot(document.getElementById("root")!).render(<ClientApp />);
