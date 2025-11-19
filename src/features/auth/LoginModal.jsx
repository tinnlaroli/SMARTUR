// import React, { useState, useRef, useEffect } from 'react'
// import { useAuth } from './AuthContext'
// import ToastSuccess from '../../components/common/ToastSuccess'
// import ToastError from '../../components/common/ToastError'

// function Loader() {
//     return (
//         <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40">
//             <div className="w-12 h-12 border-4 border-purple border-t-transparent border-solid rounded-full animate-spin"></div>
//         </div>
//     )
// }

// export default function LoginModal({ onClose, onShowRegister }) {
//     const { openForgotPasswordModal } = useAuth()
//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [code, setCode] = useState(['', '', '', '', '', '']) // Array para cada dígito
//     const [step, setStep] = useState(1) // 1: email+pass, 2: código
//     const { login, verifyCode } = useAuth()
//     const [showSuccess, setShowSuccess] = useState(false)
//     const [showError, setShowError] = useState(false)
//     const [toastMsg, setToastMsg] = useState('')
//     const [touched, setTouched] = useState({ email: false, password: false })
//     const [loading, setLoading] = useState(false)

//     // Referencias para los inputs de código
//     const inputRefs = [
//         useRef(null),
//         useRef(null),
//         useRef(null),
//         useRef(null),
//         useRef(null),
//         useRef(null),
//     ]

//     const handleLogin = async (e) => {
//         e.preventDefault()
//         setTouched({ email: true, password: true })
//         if (!email || !password) return

//         setShowSuccess(false)
//         setShowError(false)
//         setToastMsg('')
//         setLoading(true)

//         const result = await login(email, password)

//         setLoading(false)
//         if (result.success) {
//             setToastMsg(result.message || 'Código enviado al correo')
//             setShowSuccess(true)
//             setStep(2)
//             setEmail('')
//             setPassword('')
//             // Enfocar el primer input de código cuando cambiamos al paso 2
//             setTimeout(() => {
//                 if (inputRefs[0].current) {
//                     inputRefs[0].current.focus()
//                 }
//             }, 100)
//         } else {
//             setToastMsg(
//                 result.message || 'Credenciales incorrectas o error de red'
//             )
//             setShowError(true)
//             setTimeout(() => setShowError(false), 3000)
//         }
//     }

//     const handleVerifyCode = async (e) => {
//         e.preventDefault()
//         const codeString = code.join('')
//         if (codeString.length !== 6) {
//             setToastMsg('Por favor, ingresa el código completo')
//             setShowError(true)
//             setTimeout(() => setShowError(false), 3000)
//             return
//         }

//         setLoading(true)
//         setShowError(false)
//         setShowSuccess(false)
//         setToastMsg('')

//         const result = await verifyCode(codeString)

//         setLoading(false)
//         if (result.success) {
//             setToastMsg('Login exitoso')
//             setShowSuccess(true)
//             setTimeout(() => {
//                 setShowSuccess(false)
//                 onClose()
//             }, 2000)
//         } else {
//             setToastMsg(result.message || 'Código inválido')
//             setShowError(true)
//             setTimeout(() => setShowError(false), 3000)
//         }
//     }

//     // Manejar cambios en los inputs de código
//     const handleCodeChange = (index, value) => {
//         // Solo permitir números
//         if (value && !/^\d+$/.test(value)) return

//         const newCode = [...code]
//         newCode[index] = value
//         setCode(newCode)

//         // Auto-enfocar siguiente input si se ingresó un dígito
//         if (value && index < 6) {
//             inputRefs[index + 1].current.focus()
//         }
//     }

//     // Manejar tecla retroceso
//     const handleKeyDown = (index, e) => {
//         if (e.key === 'Backspace' && !code[index] && index > 0) {
//             inputRefs[index - 1].current.focus()
//         }
//     }

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//             {loading && <Loader />}
//             {showSuccess && (
//                 <ToastSuccess
//                     message={toastMsg}
//                     onClose={() => setShowSuccess(false)}
//                 />
//             )}
//             {showError && (
//                 <ToastError
//                     message={toastMsg}
//                     onClose={() => setShowError(false)}
//                 />
//             )}
//             <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp">
//                 <button
//                     className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
//                     onClick={onClose}
//                 >
//                     &times;
//                 </button>

//                 <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">
//                     {step === 1 ? 'Iniciar sesión' : 'Verificación'}
//                 </h2>

//                 {step === 1 ? (
//                     <form onSubmit={handleLogin} className="space-y-4">
//                         <div>
//                             <label className="block text-sm text-gray-600 mb-1">
//                                 Correo electrónico
//                             </label>
//                             <input
//                                 type="email"
//                                 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 onBlur={() =>
//                                     setTouched((t) => ({ ...t, email: true }))
//                                 }
//                                 required
//                             />
//                             {touched.email && !email && (
//                                 <span className="text-xs text-red-500">
//                                     Campo requerido
//                                 </span>
//                             )}
//                         </div>

//                         <div>
//                             <label className="block text-sm text-gray-600 mb-1">
//                                 Contraseña
//                             </label>
//                             <input
//                                 type="password"
//                                 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 onBlur={() =>
//                                     setTouched((t) => ({
//                                         ...t,
//                                         password: true,
//                                     }))
//                                 }
//                                 required
//                             />
//                             {touched.password && !password && (
//                                 <span className="text-xs text-red-500">
//                                     Campo requerido
//                                 </span>
//                             )}

//                             <button
//                                 type="button"
//                                 className="text-purple font-semibold hover:underline text-xs sm:text-sm"
//                                 onClick={() => {
//                                     onClose()
//                                     openForgotPasswordModal() // ✅ ahora esto existe
//                                 }}
//                             >
//                                 ¿Olvidaste tu contraseña?
//                             </button>
//                         </div>

//                         <button
//                             type="submit"
//                             className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
//                         >
//                             Iniciar sesión
//                         </button>
//                     </form>
//                 ) : (
//                     <form onSubmit={handleVerifyCode} className="space-y-6">
//                         <div className="text-center">
//                             <p className="text-sm text-gray-600 mb-4">
//                                 Ingresa el código de verificación enviado a tu
//                                 correo
//                             </p>

//                             <div className="flex justify-center space-x-3 mb-6">
//                                 {code.map((digit, index) => (
//                                     <input
//                                         key={index}
//                                         ref={inputRefs[index]}
//                                         type="text"
//                                         maxLength="1"
//                                         className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple"
//                                         value={digit}
//                                         onChange={(e) =>
//                                             handleCodeChange(
//                                                 index,
//                                                 e.target.value
//                                             )
//                                         }
//                                         onKeyDown={(e) =>
//                                             handleKeyDown(index, e)
//                                         }
//                                     />
//                                 ))}
//                             </div>
//                         </div>

//                         <div className="flex space-x-3">
//                             <button
//                                 type="button"
//                                 className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-semibold hover:bg-gray-300 transition text-sm sm:text-base"
//                                 onClick={() => setStep(1)}
//                             >
//                                 Cancelar
//                             </button>
//                             <button
//                                 type="submit"
//                                 className="flex-1 bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
//                             >
//                                 Verificar código
//                             </button>
//                         </div>
//                     </form>
//                 )}

//                 {step === 1 && (
//                     <div className="mt-6 text-center">
//                         <p className="text-xs sm:text-sm text-gray-600">
//                             ¿No tienes cuenta?
//                         </p>
//                         <button
//                             className="text-purple font-semibold hover:underline text-xs sm:text-sm"
//                             onClick={() => {
//                                 onClose()
//                                 onShowRegister()
//                             }}
//                         >
//                             Regístrate
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }
import React, { useState, useRef } from 'react';
import smarturLogo from '../../assets/smartur_logo.png';
import bgPatron from '../../assets/bgPatron.png';

function Loader() {
return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40">
    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
);
}

function ToastSuccess({ message, onClose }) {
return (
    <div className="fixed top-4 right-4 z-[100000] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slideIn">
    <div className="flex items-center gap-2">
        <span>✓</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 font-bold">×</button>
    </div>
    </div>
);
}

function ToastError({ message, onClose }) {
return (
    <div className="fixed top-4 right-4 z-[100000] bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slideIn">
    <div className="flex items-center gap-2">
        <span>⚠</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 font-bold">×</button>
    </div>
    </div>
);
}

export default function LoginModal({ onClose, onShowRegister }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [rememberMe, setRememberMe] = useState(false);
const [code, setCode] = useState(['', '', '', '', '', '']);
const [step, setStep] = useState(1);
const [showSuccess, setShowSuccess] = useState(false);
const [showError, setShowError] = useState(false);
const [toastMsg, setToastMsg] = useState('');
const [touched, setTouched] = useState({ email: false, password: false });
const [loading, setLoading] = useState(false);

const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
];

const handleLogin = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email || !password) return;

    setLoading(true);
    setShowSuccess(false);
    setShowError(false);

    setTimeout(() => {
    setLoading(false);
    setToastMsg('Código enviado al correo');
    setShowSuccess(true);
    setStep(2);
    setTimeout(() => {
        if (inputRefs[0].current) {
        inputRefs[0].current.focus();
        }
    }, 100);
    }, 1500);
};

const handleVerifyCode = (e) => {
    e.preventDefault();
    const codeString = code.join('');
    if (codeString.length !== 6) {
    setToastMsg('Por favor, ingresa el código completo');
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
    return;
    }

    setLoading(true);
    setTimeout(() => {
    setLoading(false);
    setToastMsg('Login exitoso');
    setShowSuccess(true);
    setTimeout(() => {
        onClose();
    }, 2000);
    }, 1500);
};

const handleCodeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
    inputRefs[index + 1].current.focus();
    }
};

const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
    inputRefs[index - 1].current.focus();
    }
};

const handleGoogleLogin = () => {
    setToastMsg('Login con Google próximamente');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
};

return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
    <style>{`
        @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out; }
    `}</style>

    {loading && <Loader />}
    {showSuccess && <ToastSuccess message={toastMsg} onClose={() => setShowSuccess(false)} />}
    {showError && <ToastError message={toastMsg} onClose={() => setShowError(false)} />}

    {/* Fondo con blur */}
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>

    {/* Div con patrón que sobresale del formulario */}
    <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 bg-white rounded-2xl shadow-lg animate-fadeInUp"
        style={{
            width: 'calc(30vw + 10rem)',
            height: 'calc(30vh + 16rem)',
            minWidth: '520px',
            minHeight: '750px',
            backgroundImage: `url(${bgPatron})`,
            backgroundSize: 'auto',
            backgroundPosition: 'top left',
            backgroundRepeat: 'repeat'
        }}
    ></div>

    {/* Contenedor principal con fondo limitado */}
    <div className="relative w-full max-w-md animate-fadeInUp z-50">
        {/* Fondo con patrón limitado al área del formulario */}
        <div 
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
            backgroundImage: `url(${bgPatron})`,
            backgroundSize: 'auto',
            backgroundPosition: 'top left',
            backgroundRepeat: 'repeat',
            opacity: 0.1
        }}
        ></div>
        
        {/* Contenido del formulario */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-br from-purple-50 to-white px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <img 
            src={smarturLogo} 
            alt="Smartur Logo" 
            className="h-16 mx-auto mb-4"
            onError={(e) => {
                e.target.style.display = 'none';
            }}
            />
            <h2 className="text-2xl font-bold text-gray-800">
            {step === 1 ? 'Ingresar' : 'Verificación'}
            </h2>
        </div>

        <div className="px-8 py-6">
            {step === 1 ? (
            <div className="space-y-5">
                <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Ingresar con Google
                </button>

                <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500 font-medium">o</span>
                <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo
                </label>
                <input
                    type="email"
                    placeholder="tu-email@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                />
                {touched.email && !email && (
                    <span className="text-xs text-red-500 mt-1 block">Campo requerido</span>
                )}
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                </label>
                <input
                    type="password"
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                />
                {touched.password && !password && (
                    <span className="text-xs text-red-500 mt-1 block">Campo requerido</span>
                )}
                </div>

                <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600">Recuérdame</span>
                </label>
                <button
                    onClick={() => {
                    setToastMsg('Recuperación próximamente');
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                    ¿Olvidaste tu contraseña?
                </button>
                </div>

                <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                Ingresar
                </button>
            </div>
            ) : (
            <div className="space-y-6">
                <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                    Ingresa el código de verificación enviado a tu correo
                </p>

                <div className="flex justify-center gap-3 mb-6">
                    {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        maxLength="1"
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                    />
                    ))}
                </div>
                </div>

                <div className="flex gap-3">
                <button
                    onClick={() => {
                    setStep(1);
                    setCode(['', '', '', '', '', '']);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-all"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleVerifyCode}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                    Verificar
                </button>
                </div>
            </div>
            )}

            {step === 1 && (
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                    onClick={() => {
                    onClose();
                    onShowRegister();
                    }}
                >
                    Crea una
                </button>
                </p>
            </div>
            )}
        </div>
        </div>
    </div>
    </div>
);
}