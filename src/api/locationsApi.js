import { api } from './axiosClient'

export const locationsApi = {
    getAll: () =>
        api.get('/location').then((res) => res.data.locations),

    getById: (id) =>
        api.get(`/location/${id}`).then((res) => res.data.location),

    create: (data) =>
        api.post('/location/register', data),

    update: (id, data) =>
        api.put(`/location/update/${id}`, data),

    delete: (id) =>
        api.delete(`/location/delete/${id}`),
}

