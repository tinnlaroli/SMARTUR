import React, { useState } from "react";
import { useSignUp } from "./SignUpContext";
import smarturLogo from "../../assets/smartur_logo.png";
import SmartURLoader from "../../components/ui/SmartURLoader";

/* ─── rules ───────────────────────────────────────────────────────────── */
const NAME_RULES = [
  { label: "Mínimo 3 caracteres", fn: (p) => p.trim().length >= 3 },
  {
    label: "Solo letras y espacios",
    fn: (p) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(p) && p.trim().length > 0,
  },
];

const EMAIL_RULES = [
  {
    label: "Correo electrónico válido",
    fn: (p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p),
  },
];

const RULES = [
  { label: "Mínimo 8 caracteres", fn: (p) => p.length >= 8 },
  { label: "Al menos una mayúscula", fn: (p) => /[A-Z]/.test(p) },
  { label: "Al menos una minúscula", fn: (p) => /[a-z]/.test(p) },
  { label: "Al menos un número", fn: (p) => /[0-9]/.test(p) },
  {
    label: "Al menos un carácter especial",
    fn: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  },
];
const getStrength = (p) => {
  if (!p) return 0;
  const pass = RULES.filter((r) => r.fn(p)).length;
  return pass;
};
const strengthColor = (s) => {
  if (s <= 1) return "bg-rose-500";
  if (s <= 2) return "bg-orange-400";
  if (s <= 3) return "bg-yellow-400";
  if (s <= 4) return "bg-lime-500";
  return "bg-emerald-500";
};
const strengthLabel = (s) =>
  ["", "Muy débil", "Débil", "Regular", "Buena", "Excelente"][s] ?? "";

function Toast({ type, message, onClose }) {
  const colors = type === "success" ? "bg-emerald-500" : "bg-rose-500";
  return (
    <div
      className={`fixed top-4 right-4 z-[100001] ${colors} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3`}
      style={{ animation: "slideInRight 0.3s ease-out" }}
    >
      <span className="font-bold">{type === "success" ? "✓" : "✕"}</span>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-70 hover:opacity-100 text-lg"
      >
        ×
      </button>
    </div>
  );
}

export default function SignUpModal({ onClose, onShowLogin }) {
  const { register, clearMessages } = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const strength = getStrength(password);

  const nameRulesOk = NAME_RULES.map((r) => r.fn(name));
  const isNameValid = nameRulesOk.every(Boolean);

  const emailRulesOk = EMAIL_RULES.map((r) => r.fn(email));
  const isEmailValid = emailRulesOk.every(Boolean);

  const rulesOk = RULES.map((r) => r.fn(password));
  const isPasswordValid = rulesOk.every(Boolean);

  const showToast = (type, msg) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!name || !email || !password) return;
    if (!isNameValid) return showToast("error", "El nombre es inválido");
    if (!isEmailValid) return showToast("error", "El correo es inválido");
    if (!isPasswordValid)
      return showToast("error", "La contraseña no cumple los requisitos");

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result?.success) {
      showToast("success", "¡Cuenta creada! Redirigiendo al login…");
      setTimeout(() => {
        clearMessages?.();
        onClose();
        if (onShowLogin) onShowLogin();
      }, 1400);
    } else {
      showToast(
        "error",
        result?.message || "Error al registrar. Intenta de nuevo.",
      );
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .anim-modal { animation: fadeUp 0.4s cubic-bezier(.25,.8,.25,1) both; }
      `}</style>

      {loading && <SmartURLoader isMini />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99990] bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-[420px] pointer-events-auto anim-modal">
          {/* Glow */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-[#ff7d1f]/30 via-transparent to-[#984efd]/20 blur-xl opacity-60" />

          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/60">
            {/* Header */}
            <div className="relative px-8 pt-8 pb-5 text-center bg-gradient-to-b from-slate-50 to-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <img
                src={smarturLogo}
                alt="SMARTUR"
                className="h-14 mx-auto mb-3 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <h2 className="text-xl font-bold text-gray-800">Crear cuenta</h2>
              <p className="text-sm text-gray-400 mt-1">
                Únete a la red turística de Orizaba
              </p>
            </div>

            {/* Form */}
            <div className="px-8 py-7 space-y-5">
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      placeholder="Tu nombre"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none
                        ${touched.name && !isNameValid && name ? "border-orange-400" : touched.name && !name ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50"}
                        focus:border-[#ff7d1f] focus:bg-white focus:ring-4 focus:ring-[#ff7d1f]/10`}
                    />
                  </div>
                  {touched.name && !name && (
                    <p className="text-xs text-rose-500 mt-1">
                      Campo requerido
                    </p>
                  )}
                  {touched.name && name && (
                    <ul className="mt-2 space-y-1">
                      {NAME_RULES.map((r, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${nameRulesOk[i] ? "text-emerald-600" : "text-gray-400"}`}
                        >
                          <svg
                            className="w-3.5 h-3.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            {nameRulesOk[i] ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            )}
                          </svg>
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="tu@email.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none
                        ${touched.email && !isEmailValid && email ? "border-orange-400" : touched.email && !email ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50"}
                        focus:border-[#ff7d1f] focus:bg-white focus:ring-4 focus:ring-[#ff7d1f]/10`}
                    />
                  </div>
                  {touched.email && !email && (
                    <p className="text-xs text-rose-500 mt-1">
                      Campo requerido
                    </p>
                  )}
                  {touched.email && email && (
                    <ul className="mt-2 space-y-1">
                      {EMAIL_RULES.map((r, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${emailRulesOk[i] ? "text-emerald-600" : "text-gray-400"}`}
                        >
                          <svg
                            className="w-3.5 h-3.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            {emailRulesOk[i] ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            )}
                          </svg>
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() =>
                        setTouched((t) => ({ ...t, password: true }))
                      }
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-all outline-none
                        ${touched.password && !isPasswordValid && password ? "border-orange-400" : touched.password && !password ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50"}
                        focus:border-[#ff7d1f] focus:bg-white focus:ring-4 focus:ring-[#ff7d1f]/10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Barra de fuerza — visible en cuanto hay texto, sin label */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength
                                ? strengthColor(strength)
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campo requerido — solo cuando fue tocado y está vacío */}
                  {touched.password && !password && (
                    <p className="text-xs text-rose-500 mt-1">
                      Campo requerido
                    </p>
                  )}

                  {/* Checklist completo — cuando fue tocado y tiene texto */}
                  {touched.password && password && (
                    <ul className="mt-2 space-y-1">
                      {RULES.map((r, i) => (
                        <li
                          key={i}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            rulesOk[i] ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            {rulesOk[i] ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            )}
                          </svg>
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
                    bg-gradient-to-r from-[#ff7d1f] to-[#fc478e]
                    hover:from-[#e86e15] hover:to-[#e03d7b]
                    shadow-lg shadow-[#ff7d1f]/30 hover:shadow-[#ff7d1f]/50
                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Crear mi cuenta
                </button>
              </form>

              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => {
                    onClose();
                    onShowLogin();
                  }}
                  className="text-[#984efd] font-semibold hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
