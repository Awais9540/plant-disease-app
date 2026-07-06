import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../utils/constants';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';
import { getLanguageRowStyle, getLanguageTextStyle } from '../utils/localization';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE)
      .then((storedLanguage) => {
        if (mounted && SUPPORTED_LANGUAGES.includes(storedLanguage)) {
          setLanguageState(storedLanguage);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage) => {
    const safeLanguage = SUPPORTED_LANGUAGES.includes(nextLanguage) ? nextLanguage : 'en';
    setLanguageState(safeLanguage);
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, safeLanguage);
  }, []);

  const t = useCallback(
    (key, params) => getTranslation(language, key, params),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      isUrdu: language === 'ur',
      loading,
      setLanguage,
      t,
      textStyle: getLanguageTextStyle(language),
      rowStyle: getLanguageRowStyle(language),
    }),
    [language, loading, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
