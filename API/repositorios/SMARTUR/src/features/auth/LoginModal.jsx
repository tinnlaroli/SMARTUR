import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import smarturLogo from "../../assets/smartur_logo.png";
import SmartURLoader from "../../components/ui/SmartURLoader";

/* ─── tiny inline helpers ─────────────────────────────────────────────────── */
function Toast({ type, message, onClose }) {
  const colors =
    type === "success"
      ? "bg-emerald-500 border-emerald-400"
      : "bg-rose-500 border-rose-400";
  const icon = type === "success" ? "✓" : "✕";
  return (
    <div
      className={`fixed top-4 right-4 z-[100001] ${colors} text-white px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3`}
      style={{ animation: "slideInRight 0.3s ease-out" }}
    >
      <span className="text-lg font-bold">{icon}</span>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

/* ─── OTP Input ─────────────────────────────────────────────────────────────
   6 casillas premium: auto-advance, backspace, paste completo
──────────────────────────────────────────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const digits = value.split("");
  while (digits.length < 6) digits.push("");
  const refs = Array.from({ length: 6 }, () => useRef(null));

  const update = (arr) => onChange(arr.join(""));

  const handleChange = (i, raw) => {
    const chars = raw.replace(/\D/g, "");
    if (!chars) return;
    // Si pegaron varios dígitos de una (paste manual en un input)
    if (chars.length > 1) {
      const filled = chars.slice(0, 6).split("");
      while (filled.length < 6) filled.push("");
      update(filled);
      refs[Math.min(chars.length - 1, 5)].current?.focus();
      return;
    }
    const next = [...digits];
    next[i] = chars;
    update(next);
    if (i < 5) setTimeout(() => refs[i + 1].current?.focus(), 0);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        update(next);
      } else if (i > 0) {
        next[i - 1] = "";
        update(next);
        refs[i - 1].current?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs[i - 1].current?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs[i + 1].current?.focus();
    }
  };

  /* paste event on any box */
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const filled = pasted.split("");
    while (filled.length < 6) filled.push("");
    update(filled);
    refs[Math.min(pasted.length - 1, 5)].current?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`
            w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
            ${
              d
                ? "border-[#984efd] bg-[#984efd]/5 text-[#984efd]"
                : "border-gray-200 bg-gray-50 text-gray-800"
            }
            focus:border-[#984efd] focus:bg-[#984efd]/5 focus:ring-4 focus:ring-[#984efd]/10
          `}
        />
      ))}
    </div>
  );
}

/* ─── AuthModal — Login + 2FA en un solo contenedor animado ─────────────── */
export default function LoginModal({ onClose, onShowRegister }) {
  const { login, verifyCode, openForgotPasswordModal } = useAuth();

  /* form state */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState("");

  /* ui state */
  const [step, setStep] = useState("login"); // "login" | "otp"
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // {type, message}
  const [touched, setTouched] = useState({ email: false, password: false });
  const [animDir, setAnimDir] = useState("forward"); // forward | back

  /* remember me: restore saved email */
  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email || !password) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result) return showToast("error", "Error de conexión");
    if (result.success) {
      if (rememberMe) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");
      showToast("success", result.message || "Código enviado a tu correo");
      setAnimDir("forward");
      setOtp("");
      setTimeout(() => setStep("otp"), 50);
    } else {
      showToast("error", result.message || "Credenciales incorrectas");
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) return showToast("error", "Ingresa los 6 dígitos");
    setLoading(true);
    const result = await verifyCode(otp, rememberMe);
    setLoading(false);
    if (!result) return showToast("error", "Error de conexión");
    if (result.success) {
      showToast("success", "¡Bienvenido!");
      setTimeout(onClose, 1200);
    } else {
      showToast("error", result.message || "Código inválido");
      setOtp("");
    }
  };

  /* auto-submit OTP when all 6 digits filled */
  useEffect(() => {
    if (step === "otp" && otp.length === 6) handleVerifyOtp();
  }, [otp]);

  const goBack = () => {
    setAnimDir("back");
    setTimeout(() => setStep("login"), 50);
  };

  const isLogin = step === "login";

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInLeft  { from { transform: translateX(-60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .anim-forward { animation: slideInRight 0.35s cubic-bezier(.25,.8,.25,1) both; }
        .anim-back    { animation: slideInLeft  0.35s cubic-bezier(.25,.8,.25,1) both; }
        .anim-modal   { animation: fadeUp 0.4s cubic-bezier(.25,.8,.25,1) both; }
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
          {/* Glow decorativo */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-[#984efd]/30 via-transparent to-[#fc478e]/20 blur-xl opacity-60" />

          {/* Panel principal */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/60">
            {/* Header */}
            <div className="relative px-8 pt-8 pb-5 text-center bg-gradient-to-b from-slate-50 to-white border-b border-gray-100">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                aria-label="Cerrar"
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

              <div className="flex items-center justify-center gap-2">
                {!isLogin && (
                  <button
                    onClick={goBack}
                    className="p-1 text-gray-400 hover:text-[#984efd] transition-colors"
                    aria-label="Volver al login"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {isLogin ? "Iniciar sesión" : "Verificación"}
                </h2>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {isLogin
                  ? "Accede a tu cuenta SMARTUR"
                  : "Código enviado a tu correo electrónico"}
              </p>
            </div>

            {/* Body — anima entre pasos */}
            <div className="px-8 py-7">
              {isLogin ? (
                <form
                  key="login"
                  className={`space-y-5 ${animDir === "back" ? "anim-back" : "anim-forward"}`}
                  onSubmit={handleLogin}
                >
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
                        onBlur={() =>
                          setTouched((t) => ({ ...t, email: true }))
                        }
                        placeholder="tu@email.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none
                          ${touched.email && !email ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50"}
                          focus:border-[#984efd] focus:bg-white focus:ring-4 focus:ring-[#984efd]/10`}
                        required
                      />
                    </div>
                    {touched.email && !email && (
                      <p className="text-xs text-rose-500 mt-1">
                        Campo requerido
                      </p>
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
                          ${touched.password && !password ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50"}
                          focus:border-[#984efd] focus:bg-white focus:ring-4 focus:ring-[#984efd]/10`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPw ? "Ocultar" : "Mostrar"}
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
                    {touched.password && !password && (
                      <p className="text-xs text-rose-500 mt-1">
                        Campo requerido
                      </p>
                    )}
                  </div>

                  {/* Remember me + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        onClick={() => {
                          const next = !rememberMe;
                          setRememberMe(next);
                          if (!next) localStorage.removeItem("rememberedEmail");
                        }}
                        className={`w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer flex-shrink-0
                          ${rememberMe ? "bg-[#984efd]" : "bg-gray-300"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300
                          ${rememberMe ? "left-5" : "left-0.5"}`}
                        />
                      </div>
                      <span className="text-sm text-gray-600">Recuérdame</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openForgotPasswordModal();
                      }}
                      className="text-sm text-[#984efd] hover:text-[#803ce3] font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
                      bg-gradient-to-r from-[#984efd] to-[#803ce3]
                      hover:from-[#803ce3] hover:to-[#6a2ace]
                      shadow-lg shadow-[#984efd]/30 hover:shadow-[#984efd]/50
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Iniciar sesión
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onShowRegister();
                      }}
                      className="text-[#984efd] font-semibold hover:underline"
                    >
                      Regístrate gratis
                    </button>
                  </p>
                </form>
              ) : (
                <div
                  key="otp"
                  className={`space-y-6 ${animDir === "forward" ? "anim-forward" : "anim-back"}`}
                >
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#984efd]/10 to-[#fc478e]/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-[#984efd]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                  </div>

                  <OtpInput value={otp} onChange={setOtp} />

                  <p className="text-center text-xs text-gray-400">
                    El código expira en 10 minutos · Revisa tu carpeta de spam
                  </p>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={otp.length < 6}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
                      ${
                        otp.length === 6
                          ? "bg-gradient-to-r from-[#984efd] to-[#803ce3] text-white shadow-lg shadow-[#984efd]/30 hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    Verificar código
                  </button>

                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Regresar al inicio de sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
