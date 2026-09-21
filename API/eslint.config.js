import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'docs/**', 'tests/**'] },

    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2022,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            // Argumentos con prefijo _ están descartados a propósito (callbacks express)
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
];