import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function ToastError({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      className="fixed top-6 right-6 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn"
      style={{
        backgroundColor: "#e60000",  // rojo sólido
        color: "#fff",
        border: "1px solid darkred",
      }}
    >
      <span>❌ {message}</span>
      <button 
        onClick={onClose} 
        className="ml-2 hover:text-red-100 transition-colors"
      >
        <FaTimes />
      </button>
    </div>
  );
}
