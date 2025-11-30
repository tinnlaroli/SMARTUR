import React from 'react'

export default function SearchBar({
    onChange,
    placeholder = 'Buscar usuario...',
}) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                 focus:ring-blue-500 outline-none"
        />
    )
}

