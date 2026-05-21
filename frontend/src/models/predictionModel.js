export const createPredictionModel = data => ({
  id: Date.now().toString(),
  disease: data?.disease || 'Unknown Disease',
  confidence: Number(data?.confidence || 0),
  severity: data?.severity || 'Low',
  description: data?.description || 'No description available.',
  treatment: data?.treatment || [],
  prevention: data?.prevention || [],
  learnMore: data?.learn_more || [],
  cropType: data?.cropType || 'Unknown Crop',
  imageUri: data?.imageUri || null,
  gradcamImage: data?.gradcamImage || null,
  createdAt: data?.createdAt || new Date().toISOString(),
  xaiInsight:
    data?.xaiInsight ||
    'AI focused on the highlighted infected portions of the leaf for this prediction.'
});
