import { api } from './axiosClient'

export const pointsOfInterestApi = {
    getAll: () =>
        api.get('/points-of-interest').then((res) => res.data.points),

    getById: (id) =>
        api
            .get(`/points-of-interest/${id}`)
            .then((res) => res.data.pointOfInterest || res.data),

    create: (data) => api.post('/points-of-interest/register', data),

    update: (id, data) =>
        api.put(`/points-of-interest/update/${id}`, data),

    delete: (id) => api.delete(`/points-of-interest/delete/${id}`),
}

