import React from 'react'
import { Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export default function Toast({ type = 'info', message }) {
    const styles = {
        info: {
            icon: <Info className="size-4 text-blue-500" />,
            bg: 'bg-white',
            border: 'border-gray-200',
        },
        success: {
            icon: <CheckCircle2 className="size-4 text-white" />,
            bg: 'bg-green-500',
            border: 'border-green-600',
        },
        error: {
            icon: <XCircle className="size-4 text-white" />,
            bg: 'bg-red-500',
            border: 'border-red-600',
        },
        warning: {
            icon: <AlertTriangle className="size-4 text-yellow-500" />,
            bg: 'bg-white',
            border: 'border-gray-200',
        },
    }

    const style = styles[type]
    const isColored = type === 'success' || type === 'error'

    return (
        <div
            className={`max-w-xs ${style.bg} border ${style.border} rounded-xl shadow-lg`}
            role="alert"
        >
            <div className="flex p-4">
                <div className="shrink-0 mt-0.5">{style.icon}</div>
                <div className="ms-3">
                    <p
                        className={`text-sm ${
                            isColored ? 'text-white' : 'text-gray-700'
                        }`}
                    >
                        {message}
                    </p>
                </div>
            </div>
        </div>
    )
}

