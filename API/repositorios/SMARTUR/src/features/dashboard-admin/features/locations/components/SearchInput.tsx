import React from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

const SearchInput = React.memo(({ value, onChange }: Props) => {
    return (
        <input
            type="text"
            placeholder="Buscar por nombre..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-64 rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
    );
});

export default SearchInput;
