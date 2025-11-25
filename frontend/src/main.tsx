import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/pdf-setup"; // Initialize PDF.js worker

createRoot(document.getElementById("root")!).render(<App />);
