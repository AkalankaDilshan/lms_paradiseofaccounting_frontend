import axios from 'axios';
import { setupMockAdapter } from './mockClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Since the infra is not deployed yet, we intercept requests and mock them.
// In a real scenario, this would be guarded by an env variable like VITE_USE_MOCKS=true.
setupMockAdapter(apiClient);

export default apiClient;
