import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Detection APIs
export const detectionApi = {
  detectDebris: async (file: File, confidenceThreshold = 0.5) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(
      `/detect/debris?confidence_threshold=${confidenceThreshold}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
  
  detectBatch: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    
    const response = await api.post('/detect/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Ecosystem APIs
export const ecosystemApi = {
  analyze: async (file: File, analysisType = 'full') => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(
      `/ecosystem/analyze?analysis_type=${analysisType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
  
  compare: async (fileBefore: File, fileAfter: File) => {
    const formData = new FormData();
    formData.append('file_before', fileBefore);
    formData.append('file_after', fileAfter);
    
    const response = await api.post('/ecosystem/compare', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Wave Data APIs
export const waveApi = {
  getCurrent: async (lat: number, lon: number) => {
    const response = await api.get(`/wave/current?lat=${lat}&lon=${lon}`);
    return response.data;
  },
  
  getForecast: async (lat: number, lon: number, hours = 24) => {
    const response = await api.get(
      `/wave/forecast?lat=${lat}&lon=${lon}&hours=${hours}`
    );
    return response.data;
  },
};

// Risk Assessment APIs
export const riskApi = {
  assess: async (lat: number, lon: number, debrisData?: any) => {
    const response = await api.post(
      `/risk/assess?lat=${lat}&lon=${lon}`,
      debrisData
    );
    return response.data;
  },
};

// Alert APIs
export const alertApi = {
  getActive: async () => {
    const response = await api.get('/alerts/active');
    return response.data;
  },
  
  subscribe: async (
    lat: number,
    lon: number,
    radiusKm: number,
    alertTypes: string[]
  ) => {
    const response = await api.post('/alerts/subscribe', null, {
      params: { lat, lon, radius_km: radiusKm, alert_types: alertTypes },
    });
    return response.data;
  },
};

// Map Data APIs
export const mapApi = {
  getDebrisZones: async (bounds: string) => {
    const response = await api.get(`/map/debris-zones?bounds=${bounds}`);
    return response.data;
  },
  
  getEcosystemRegions: async (bounds: string) => {
    const response = await api.get(`/map/ecosystem-regions?bounds=${bounds}`);
    return response.data;
  },
};

export default api;


