// import React, { useState } from 'react'
// import { useSignUp } from './SignUpContext'
// import ToastSuccess from '../../components/common/ToastSuccess'
// import ToastError from '../../components/common/ToastError'

// export default function SignUpModal({ onClose, onShowLogin }) {
//     const [name, setName] = useState('')
//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [showSuccess, setShowSuccess] = useState(false)
//     const [showError, setShowError] = useState(false)
//     const [toastMsg, setToastMsg] = useState('')
//     const [touched, setTouched] = useState({
//         name: false,
//         email: false,
//         password: false,
//     })
//     const { register, error, success, clearMessages } = useSignUp()

//     const handleRegister = async (e) => {
//         e.preventDefault()
//         setTouched({ name: true, email: true, password: true })
//         if (!name || !email || !password) return
//         setShowSuccess(false)
//         setShowError(false)
//         setToastMsg('')
//         const result = await register(name, email, password)
//         if (result.success) {
//             setToastMsg('registro exitoso')
//             setShowSuccess(true)
//             setName('')
//             setEmail('')
//             setPassword('')
//             setTouched({ name: false, email: false, password: false })
//             setTimeout(() => {
//                 setShowSuccess(false)
//                 clearMessages()
//             }, 2000)
//             setTimeout(() => {
//                 onClose()
//             }, 800)
//         } else {
//             setToastMsg(error)
//             setShowError(true)
//         }
//     }

//     return (
//         <>
//             {showSuccess && (
//                 <ToastSuccess
//                     message={toastMsg}
//                     onClose={() => {
//                         setShowSuccess(false)
//                         clearMessages()
//                     }}
//                 />
//             )}
//             {showError && (
//                 <ToastError
//                     message={toastMsg}
//                     onClose={() => {
//                         setShowError(false)
//                         clearMessages()
//                     }}
//                 />
//             )}
//             <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//                 <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 relative animate-fadeInUp">
//                     {/* Botón cerrar */}
//                     <button
//                         className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
//                         onClick={onClose}
//                     >
//                         &times;
//                     </button>

//                     <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-purple">
//                         Registrarse
//                     </h2>

//                     <form onSubmit={handleRegister} className="space-y-4">
//                         <div>
//                             <label className="block text-sm text-gray-600 mb-1">
//                                 Nombre
//                             </label>
//                             <input
//                                 type="text"
//                                 className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple text-sm sm:text-base"
//                                 value={name}
//                                 onChange={(e) => setName(e.target.value)}
//                                 onBlur={() =>
//                                     setTouched((t) => ({ ...t, name: true }))
//                                 }
//                                 required
//                             />
//                             {touched.name && !name && (
//                                 <span className="text-xs text-red-500">
//                                     Campo requerido
//                                 </span>
//                             )}
//                         </div>

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
//                         </div>

//                         <button
//                             type="submit"
//                             className="w-full bg-orange text-white py-2 rounded-md font-semibold hover:bg-orange/90 transition text-sm sm:text-base"
//                         >
//                             Registrarse
//                         </button>
//                     </form>

//                     <div className="text-center mt-4">
//                         <span className="text-sm">¿Ya tienes cuenta? </span>
//                         <button
//                             className="text-purple font-semibold text-sm hover:underline"
//                             onClick={() => {
//                                 onClose()
//                                 onShowLogin()
//                             }}
//                         >
//                             Inicia sesión
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     )
// }

import React, { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import { useSignUp } from './SignUpContext'
import ToastSuccess from '../../components/common/ToastSuccess'
import ToastError from '../../components/common/ToastError'
import smarturLogo from '../../assets/smartur_logo.png'
import bgPatron from '../../assets/bgPatron.png'

export default function SignUpModal({ onClose, onShowLogin }) {
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [showSuccess, setShowSuccess] = useState(false)
const [showError, setShowError] = useState(false)
const [toastMsg, setToastMsg] = useState('')
const [touched, setTouched] = useState({
name: false,
email: false,
password: false,
})
const { register, error, success, clearMessages } = useSignUp()

const handleRegister = async (e) => {
e.preventDefault()
setTouched({ name: true, email: true, password: true })
if (!name || !email || !password) return
setShowSuccess(false)
setShowError(false)
setToastMsg('')
const result = await register(name, email, password)
if (result.success) {
setToastMsg('registro exitoso')
setShowSuccess(true)
setName('')
setEmail('')
setPassword('')
setTouched({ name: false, email: false, password: false })
setTimeout(() => {
setShowSuccess(false)
clearMessages()
}, 2000)
setTimeout(() => {
onClose()
}, 800)
} else {
setToastMsg(error)
setShowError(true)
}
}

const handleGoogleSignUp = () => {
setToastMsg('Registro con Google próximamente')
setShowSuccess(true)
setTimeout(() => setShowSuccess(false), 2000)
}

return (
<>
{showSuccess && (
<ToastSuccess
    message={toastMsg}
    onClose={() => {
        setShowSuccess(false)
        clearMessages()
    }}
/>
)}
{showError && (
<ToastError
    message={toastMsg}
    onClose={() => {
        setShowError(false)
        clearMessages()
    }}
/>
)}
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

{/* Fondo con blur */}
<div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>

{/* Div con patrón que sobresale del formulario */}
<div 
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 bg-white rounded-2xl shadow-lg" // <- Animación eliminada aquí
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
        <button
            onClick={onClose}
            aria-label="Cerrar modal de registro"
            className="absolute top-4 right-4 bg-white text-gray-600 hover:text-red-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-full w-12 h-12 flex items-center justify-center border-0 hover:bg-red-50 hover:scale-105 z-10"
        >
            <FaTimes className="text-xl" />
        </button>
        <div className="bg-gradient-to-br from-purple-50 to-white px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <img 
                src={smarturLogo} 
                alt="Smartur Logo" 
                className="h-16 mx-auto mb-4"
                onError={(e) => {
                    e.target.style.display = 'none'
                }}
            />
            <h2 className="text-2xl font-bold text-gray-800">
                Registrarse
            </h2>
        </div>

        <div className="px-8 py-6">
            <form onSubmit={handleRegister} className="space-y-5">
                <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Registrarse con Google
                </button>

                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-sm text-gray-500 font-medium">o</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                    </label>
                    <input
                        type="text"
                        placeholder="Tu nombre completo"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() =>
                            setTouched((t) => ({ ...t, name: true }))
                        }
                        required
                    />
                    {touched.name && !name && (
                        <span className="text-xs text-red-500 mt-1 block">Campo requerido</span>
                    )}
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
                        onBlur={() =>
                            setTouched((t) => ({ ...t, email: true }))
                        }
                        required
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
                        onBlur={() =>
                            setTouched((t) => ({
                                ...t,
                                password: true,
                            }))
                        }
                        required
                    />
                    {touched.password && !password && (
                        <span className="text-xs text-red-500 mt-1 block">Campo requerido</span>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                    Registrarse
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{' '}
                    <button
                        className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                        onClick={() => {
                            onClose()
                            onShowLogin()
                        }}
                    >
                        Inicia sesión
                    </button>
                </p>
            </div>
        </div>
    </div>
</div>
</div>
</>
)
}
