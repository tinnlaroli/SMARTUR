import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import AOS from 'aos'
import 'aos/dist/aos.css'

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SignUpProvider } from './context/SignUpContext'

AOS.init()

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SignUpProvider>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </SignUpProvider>
    </AuthProvider>
  </BrowserRouter>,
)
