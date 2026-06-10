import axios from 'axios';

export const BACKEND_URL = '';

const API_BASE_URL = '/api';

export const predictEmotion = async (
  file,
  sessionId = null,
  detectionType = 'upload'
) => {
  const formData = new FormData();
  formData.append('file', file);

  let url = `${API_BASE_URL}/predict?detection_type=${encodeURIComponent(detectionType)}`;

  if (sessionId) {
    url += `&session_id=${encodeURIComponent(sessionId)}`;
  }

  try {
    const response = await axios.post(url, formData);
    return response.data;
  } catch (error) {
    console.error('Predict API error:', error);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }

    throw error;
  }
};

export const checkSessionStatus = async (sessionId) => {
  const response = await axios.get(
    `${API_BASE_URL}/session/${encodeURIComponent(sessionId)}`
  );

  return response.data;
};

export const getHistory = async () => {
  const response = await axios.get(`${API_BASE_URL}/history`);
  return response.data;
};

export const deleteAllHistory = async () => {
  const response = await axios.delete(`${API_BASE_URL}/history`);
  return response.data;
};

export const deleteHistoryItem = async (id) => {
  const response = await axios.delete(
    `${API_BASE_URL}/history/${encodeURIComponent(id)}`
  );

  return response.data;
};