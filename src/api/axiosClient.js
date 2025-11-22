import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    //  mimimi mirenme lo pongo en el 3002
     // Le problème, c'est la vie et le fait que tu veux être spécial
})
