export const usersConfig = {
    title: 'Administrador de usuarios',
    columns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role_id', label: 'Rol' },
        { key: 'registered_at', label: 'Registrado' },
    ],

    form: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        {
            name: 'password',
            label: 'Contraseña',
            type: 'password',
            required: true,
            skipOnEdit: true,
        },
    ],
}

