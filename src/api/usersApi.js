import { api } from './axiosClient'

export const usersApi = {
    getAll: () => api.get('/users').then((res) => res.data.users),

    create: (data) => api.post('/users/register', data),

    delete: (id) => api.delete(`/users/delete/${id}`),
}
