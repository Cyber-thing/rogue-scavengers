import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/press-start-2p/latin-400.css";
import "@fontsource/press-start-2p/cyrillic-400.css";
import "@fontsource/tektur/latin-600.css";
import "@fontsource/tektur/cyrillic-600.css";
import "@fontsource/tektur/latin-700.css";
import "@fontsource/tektur/cyrillic-700.css";
import "@fontsource/tektur/latin-800.css";
import "@fontsource/tektur/cyrillic-800.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/cyrillic-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/ibm-plex-mono/cyrillic-600.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
