import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SPA deep-link fallback: restaurar path salvo pelo 404.html (produção)
const savedPath = sessionStorage.getItem('SPA_REDIRECT_PATH');
if (savedPath) {
  history.replaceState(null, "", savedPath);
  sessionStorage.removeItem('SPA_REDIRECT_PATH');
}

createRoot(document.getElementById("root")!).render(<App />);
