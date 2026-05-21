import { API_BASE_URL } from '../utils/constants';

export const predictLeafDisease = async (imageUri) => {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: 'leaf.jpg',
    type: 'image/jpeg',
  });

  console.log('Sending image to:', `${API_BASE_URL}/predict`);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  const text = await response.text();
  console.log('Raw backend response:', text);

  if (!response.ok) {
    throw new Error(`Backend error ${response.status}: ${text}`);
  }

  return JSON.parse(text);
};
