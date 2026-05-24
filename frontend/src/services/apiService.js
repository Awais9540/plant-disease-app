import { API_BASE_URL } from '../utils/constants';
import { supabase } from './supabase';

export const predictLeafDisease = async (imageUri, cropName = 'Unknown') => {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: 'leaf.jpg',
    type: 'image/jpeg',
  });
  
  formData.append('crop', cropName);

  console.log('Sending image to:', `${API_BASE_URL}/predict`);

  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const text = await response.text();
  console.log('Raw backend response:', text);

  if (!response.ok) {
    throw new Error(`Backend error ${response.status}: ${text}`);
  }

  return JSON.parse(text);
};
