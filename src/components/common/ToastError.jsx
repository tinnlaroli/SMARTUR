import React, { useEffect } from "react";

export default function ToastError({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] px-4 py-3 border border-red-700 bg-red-500 text-white rounded shadow-lg">
      ❌ {message}
    </div>
  );
}
