import { api } from './axiosClient'

export const adminApi = {
    getAll: () => api.get('/admin').then((res) => res.data.admins),

    getById: (id) =>
        api.get(`/admin/${id}`).then((res) => res.data.admin),

    create: (data) => api.post('/admin/register', data),

    update: (id, data) =>
        api.put(`/admin/update/${id}`, data),

    delete: (id) => api.delete(`/admin/delete/${id}`),
}
