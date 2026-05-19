import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import "./index.css";

import AOS from "aos";
import "aos/dist/aos.css";

// Fix aggressive caching in development from vite-plugin-pwa
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister(); // Always unregister to prevent old cached files
    }
  });
  // Clear entirely
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}

AOS.init();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
