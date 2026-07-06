import { cropNames, diseaseAdviceUr, diseaseNamesUr, getTranslation } from './translations';

export const normalizeTextKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

export const getLanguageTextStyle = (language) =>
  language === 'ur'
    ? {
        writingDirection: 'rtl',
        textAlign: 'right',
      }
    : null;

export const getLanguageRowStyle = (language) =>
  language === 'ur'
    ? {
        flexDirection: 'row-reverse',
      }
    : null;

export const getCropLabel = (crop, language) => {
  const safeCrop = crop || 'Unknown';
  if (language === 'ur') {
    return cropNames.ur[safeCrop] || cropNames.ur[safeCrop.replace(' ', '_')] || safeCrop.replace('_', ' ');
  }
  return cropNames.en[safeCrop] || safeCrop.replace('_', ' ');
};

export const getDiseaseLabel = (disease, language) => {
  if (language !== 'ur') return disease || getTranslation(language, 'unknownDisease');
  return diseaseNamesUr[normalizeTextKey(disease)] || disease || getTranslation(language, 'unknownDisease');
};

export const getSeverityLabel = (severity, language) => {
  const key = normalizeTextKey(severity);
  if (key === 'high') return getTranslation(language, 'high');
  if (key === 'medium') return getTranslation(language, 'medium');
  if (key === 'low') return getTranslation(language, 'low');
  if (key === 'healthy') return getTranslation(language, 'healthy');
  return severity || getTranslation(language, 'notAvailable');
};

export const getLocalizedResult = (result, language) => {
  if (!result) return null;

  if (language !== 'ur') {
    return {
      ...result,
      displayCrop: getCropLabel(result.crop, language),
      displayDisease: result.disease,
      displaySeverity: result.severity,
      displayDescription: result.description,
      displayTreatment: result.treatment,
      displayPrevention: result.prevention,
      displayLearnMore: result.learn_more || result.learnMore,
      displayXaiInsight: result.xaiInsight,
    };
  }

  const diseaseKey = normalizeTextKey(result.disease);
  const advice = diseaseAdviceUr[diseaseKey];

  return {
    ...result,
    displayCrop: getCropLabel(result.crop, language),
    displayDisease: getDiseaseLabel(result.disease, language),
    displaySeverity: getSeverityLabel(result.severity, language),
    displayDescription: advice?.description || result.description,
    displayTreatment: advice?.treatment || result.treatment,
    displayPrevention: advice?.prevention || result.prevention,
    displayLearnMore: advice?.learn_more || result.learn_more || result.learnMore,
    displayXaiInsight:
      result.is_healthy
        ? 'پتا صحت مند لگ رہا ہے، اس لیے بیماری والا حصہ نمایاں نہیں کیا گیا۔'
        : 'AI نے پتے کے متاثرہ حصوں کو Grad-CAM کے ذریعے نمایاں کیا ہے۔',
  };
};
