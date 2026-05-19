// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL ?? "http://localhost:5174";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [userTemp, setUserTemp] = useState(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isGlobalLoading, setGlobalLoading] = useState(false);

  // Función para guardar la sesión en localStorage
  const saveSession = (token, userData, rememberMe = false) => {
    const sessionData = {
      token,
      user: userData,
      expiresAt: rememberMe
        ? Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 días
        : Date.now() + 24 * 60 * 60 * 1000, // 24 horas
      rememberMe,
    };
    localStorage.setItem("session", JSON.stringify(sessionData));
    localStorage.setItem("token", token);
  };

  // Función para obtener la sesión desde localStorage
  const getSession = () => {
    try {
      const sessionStr = localStorage.getItem("session");
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);

      // Verificar si la sesión ha expirado
      if (session.expiresAt && Date.now() > session.expiresAt) {
        clearSession();
        return null;
      }

      return session;
    } catch (error) {
      if (import.meta.env.DEV) console.error("[getSession] Error:", error);
      return null;
    }
  };

  // Función para limpiar la sesión
  const clearSession = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("token");
    // Limpiar también las claves del Dashboard para cierre de sesión total
    localStorage.removeItem("smartur_token");
    localStorage.removeItem("smartur_user");
    // No eliminar rememberedEmail para mantenerlo si el usuario lo guardó
  };

  // Verificar sesión existente al cargar la aplicación
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = getSession();
        if (session && session.token && session.user) {
          setUser(session.user);
        }
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("[restoreSession] Error:", error);
        clearSession();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    restoreSession();
  }, []);

  // Paso 1: login con email y contraseña
  const handleLoginStep1 = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const textResponse = await response.text();
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const snippet = (textResponse || "").substring(0, 200);
        return {
          success: false,
          message: snippet
            ? `Respuesta no JSON: ${snippet}`
            : "Respuesta vacía del servidor",
        };
      }

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch {
        return {
          success: false,
          message: `Error del servidor: ${(textResponse || "").substring(0, 200)}`,
        };
      }

      const isSuccess = response.ok || data?.status === 200;
      if (!isSuccess)
        return {
          success: false,
          message: data?.message || "Credenciales incorrectas",
        };

      // Extraer campos desde data.data o desde la raíz
      const dataContainer = data?.data || data;
      const userId = dataContainer?.userId;
      const emailFromApi = dataContainer?.email;
      const role = dataContainer?.role;

      const confirmedEmail = emailFromApi || email;
      setLoginEmail(confirmedEmail);
      if (userId || role || emailFromApi) {
        setUserTemp({
          id: userId ?? null,
          email: confirmedEmail,
          role: role ?? null,
        });
      } else {
        setUserTemp(null);
      }
      setShowCodeModal(true);

      return {
        success: true,
        message: data?.message || "Código de verificación generado",
      };
    } catch (error) {
      if (import.meta.env.DEV) console.error("[login] Error:", error);
      return {
        success: false,
        message: error.message || "Error desconocido",
      };
    }
  };

  const openForgotPasswordModal = () => setShowForgotPasswordModal(true);
  const closeForgotPasswordModal = () => setShowForgotPasswordModal(false);

  // Paso 2: verificar código 2FA
  const handleVerifyCode = async (verificationCode, rememberMe = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/two-factor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          token: verificationCode,
        }),
      });

      const textResponse = await response.text();
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const snippet = (textResponse || "").substring(0, 200);
        return {
          success: false,
          message: snippet
            ? `Respuesta no JSON: ${snippet}`
            : "Respuesta vacía del servidor",
        };
      }

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch {
        return {
          success: false,
          message: `Error del servidor: ${(textResponse || "").substring(0, 200)}`,
        };
      }

      const isSuccess = response.ok || data?.status === 200;
      if (!isSuccess)
        return {
          success: false,
          message: data?.message || "Código inválido",
        };

      const payload = data?.data || data;
      if (!payload)
        return { success: false, message: "Respuesta inesperada del servidor" };

      const userObj = payload.user || null;
      if (!userObj)
        return {
          success: false,
          message: "Usuario no presente en la respuesta",
        };

      // Guardar sesión
      if (payload.token) {
        saveSession(payload.token, userObj, rememberMe);
      }

      setUser(userObj);

      const roleId = userObj?.roleId ?? userObj?.role_id ?? userObj?.role?.id;

      // Redirección basada en rol
      if (roleId === 1 || userObj?.role === "admin") {
        setShowCodeModal(false);
        setGlobalLoading(true);
        // Admin → Dashboard. Token + datos de usuario en el hash (cross-origin).
        const tok = encodeURIComponent(
          payload.token || localStorage.getItem("token") || "",
        );
        const usr = encodeURIComponent(btoa(JSON.stringify(userObj)));

        setTimeout(() => {
          window.location.href = `${DASHBOARD_URL}/dashboard#access_token=${tok}&user=${usr}`;
        }, 2200); // Darle tiempo a la animación de SmartURLoader

        return { success: true };
      } else if (roleId === 2 || userObj?.role === "user") {
        // Usuario normal → Landing + formulario
        setShowFormModal(true);
      } else {
        // Fallback heurístico
        if (typeof userObj?.id === "number" && userObj.id === 1) {
          setShowCodeModal(false);
          setGlobalLoading(true);
          const tok = encodeURIComponent(
            payload.token || localStorage.getItem("token") || "",
          );
          const usr = encodeURIComponent(btoa(JSON.stringify(userObj)));

          setTimeout(() => {
            window.location.href = `${DASHBOARD_URL}/dashboard#access_token=${tok}&user=${usr}`;
          }, 2200);

          return { success: true };
        } else {
          setShowFormModal(true);
        }
      }

      setShowCodeModal(false);
      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) console.error("[verify-code] Error:", error);
      return {
        success: false,
        message: error.message || "Error desconocido",
      };
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setUserTemp(null);
    setLoginEmail("");
    setShowFormModal(false);
    setShowCodeModal(false);
    clearSession();
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userTemp,
        loginEmail,
        showFormModal,
        showCodeModal,
        showForgotPasswordModal,
        isCheckingAuth,
        isGlobalLoading,
        setGlobalLoading,
        login: handleLoginStep1,
        verifyCode: handleVerifyCode,
        logout,
        showMultiStepForm: () => setShowFormModal(true),
        hideMultiStepForm: () => setShowFormModal(false),
        openForgotPasswordModal,
        closeForgotPasswordModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
