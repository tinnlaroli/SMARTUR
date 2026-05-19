import React from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

const SearchInput = React.memo(({ value, onChange, placeholder }: Props) => {
    return (
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-64 rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
    );
});

export default SearchInput;
