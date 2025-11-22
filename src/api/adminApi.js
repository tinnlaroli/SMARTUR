import { api } from './axiosClient'

export const adminApi = {
    getAll: () => api.get('/admin').then((res) => res.data.admins),

    create: (data) => api.post('/admin/register', data),

    delete: (id) => api.delete(`/admin/delete/${id}`),
}
