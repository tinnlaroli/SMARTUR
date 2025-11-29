import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import AOS from 'aos'
import 'aos/dist/aos.css'

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { SignUpProvider } from './features/auth/SignUpContext.jsx'

AOS.init()

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter
        future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
        }}
    >
        <AuthProvider>
            <SignUpProvider>
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            </SignUpProvider>
        </AuthProvider>
    </BrowserRouter>
)

// Registro básico del Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .catch((error) => {
                console.error('Error al registrar el Service Worker:', error)
            })
    })
}