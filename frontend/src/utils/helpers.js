export const formatDate = value => new Date(value).toLocaleDateString();

export const getSeverityColor = severity => {
  const key = String(severity || '').toLowerCase();
  if (key === 'high') return '#D32F2F';
  if (key === 'medium') return '#F9A825';
  return '#2E7D32';
};

export const toBase64Uri = base64String => {
  if (!base64String) return null;
  if (base64String.startsWith('data:image')) return base64String;
  return `data:image/jpeg;base64,${base64String}`;
};

export const convertArea = (value, from, to) => {
  const map = {
    acre: 4046.8564224,
    hectare: 10000,
    marla: 25.29285264,
    kanal: 505.8570528,
    'square meter': 1,
    'square feet': 0.092903
  };
  const squareMeters = Number(value || 0) * map[from];
  return squareMeters / map[to];
};
