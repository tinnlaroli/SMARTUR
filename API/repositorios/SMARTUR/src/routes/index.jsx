import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthContext";
import { SignUpProvider } from "../features/auth/SignUpContext";
import Landing from "../pages/Landing";
import NotFound from "../pages/NotFound";

// Componente wrapper que envuelve las rutas con los providers
function AppWithProviders({ children }) {
  return (
    <AuthProvider>
      <SignUpProvider>{children}</SignUpProvider>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppWithProviders>
        <Landing />
      </AppWithProviders>
    ),
  },
  {
    path: "*",
    element: (
      <AppWithProviders>
        <NotFound />
      </AppWithProviders>
    ),
  },
]);
