import axios from 'axios';

const API_BASE_URL = 'https://bits-lost-found-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const signUpUser = async (email, password) => {
  if (!email.includes('bits-pilani.ac.in')) {
    throw new Error('Please use a valid BITS student/faculty email.');
  }
  const res = await api.post('/auth/signup', { email, password });
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const fetchItems = async (filters = {}) => {
  const response = await api.get('/items', { params: filters });
  return response.data;
};

export const createItem = async (itemData) => {
  const response = await api.post('/items', itemData);
  return response.data;
};

export default api;