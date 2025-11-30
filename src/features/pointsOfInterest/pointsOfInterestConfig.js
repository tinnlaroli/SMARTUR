export const pointsOfInterestConfig = {
    title: 'Administrador de puntos de interés',
    columns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Nombre' },
        { key: 'description', label: 'Descripción' },
        { key: 'typeId', label: 'Tipo' },
        { key: 'locationId', label: 'Ubicación' },
        { key: 'sustainability', label: 'Sostenible' },
        { key: 'image_url', label: 'Imagen' },
    ],

    form: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        {
            name: 'description',
            label: 'Descripción',
            type: 'textarea',
            required: false,
        },
        { name: 'typeId', label: 'Tipo', type: 'number', required: false },
        {
            name: 'locationId',
            label: 'Ubicación',
            type: 'number',
            required: false,
        },
        {
            name: 'sustainability',
            label: 'Sostenible',
            type: 'checkbox',
            required: false,
        },
        {
            name: 'image_url',
            label: 'URL de Imagen',
            type: 'text',
            required: false,
        },
    ],
}

