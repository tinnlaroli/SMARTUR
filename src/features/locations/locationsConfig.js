export const locationsConfig = {
    title: 'Administrador de ubicaciones',
    columns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Nombre' },
        { key: 'state', label: 'Estado' },
        { key: 'municipality', label: 'Municipio' },
        { key: 'latitude', label: 'Latitud' },
        { key: 'longitude', label: 'Longitud' },
    ],

    form: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'state', label: 'Estado', type: 'text', required: false },
        {
            name: 'municipality',
            label: 'Municipio',
            type: 'text',
            required: false,
        },
        {
            name: 'latitude',
            label: 'Latitud',
            type: 'number',
            required: false,
            step: '0.000001',
        },
        {
            name: 'longitude',
            label: 'Longitud',
            type: 'number',
            required: false,
            step: '0.000001',
        },
    ],
}

