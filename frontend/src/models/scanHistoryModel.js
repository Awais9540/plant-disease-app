export const createHistoryItem = prediction => ({
  ...prediction,
  savedAt: new Date().toISOString()
});
