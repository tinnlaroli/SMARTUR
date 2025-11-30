import { api } from './axiosClient'

export const usersApi = {
    getAll: () => api.get('/users').then((res) => res.data.users),

    getById: (id) =>
        api.get(`/users/${id}`).then((res) => res.data.user),

    create: (data) => api.post('/users/register', data),

    update: (id, data) =>
        api.put(`/users/update/${id}`, data),

    delete: (id) => api.delete(`/users/delete/${id}`),
}
