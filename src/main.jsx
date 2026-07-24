import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import ToastContainer from "./components/notifications/ToastContainer";
import { PlayerProvider } from "./context/PlayerContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PlayerProvider>
      <App />
      <ToastContainer />
    </PlayerProvider>
  </StrictMode>,
);