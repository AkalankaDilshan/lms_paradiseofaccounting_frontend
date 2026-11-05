import axios from 'axios';
import { setupMockAdapter } from './mockClient';
import { USE_MOCK, getIdToken } from '../lib/cognito';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (USE_MOCK) {
  setupMockAdapter(apiClient);
} else {
  // API Gateway's Cognito JWT authorizer rejects any request without a bearer ID token
  apiClient.interceptors.request.use(async (config) => {
    const token = await getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export default apiClient;
