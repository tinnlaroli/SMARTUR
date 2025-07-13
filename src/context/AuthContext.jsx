import React from "react";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const login = (email, password) => {
    if (email === "admin@smartur.com" && password === "123456") {
      setUser({ email, role: "admin" });
      navigate("/dashboard");
    } else if (email === "usuario@smartur.com" && password === "123456") {
      setUser({ email, role: "usuario" });
      setShowFormModal(true); // Muestra el modal directamente
    } else {
      alert("Credenciales incorrectas");
    }
  };

  const logout = () => {
    setUser(null);
    setShowFormModal(false);
    navigate("/login");
  };

  const showMultiStepForm = () => {
    if (user?.role === "usuario") {
      setShowFormModal(true);
    }
  };

  const hideMultiStepForm = () => {
    setShowFormModal(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      showFormModal, 
      showMultiStepForm, 
      hideMultiStepForm 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
