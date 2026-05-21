import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

export const getHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Get history error:', error);
    return [];
  }
};

export const saveHistoryItem = async (item) => {
  try {
    const oldHistory = await getHistory();
    const updatedHistory = [item, ...oldHistory];
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.log('Save history error:', error);
    return false;
  }
};

export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.log('Clear history error:', error);
  }
};

export const getOnboardingSeen = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
    return value === 'true';
  } catch {
    return false;
  }
};

export const setOnboardingSeen = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
};

export const saveProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.log('Save profile error:', error);
    return false;
  }
};

export const getProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log('Get profile error:', error);
    return null;
  }
};

export const saveCalculatorInputs = async (values) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CALCULATOR_INPUTS,
      JSON.stringify(values)
    );
    return true;
  } catch (error) {
    console.log('Save calculator inputs error:', error);
    return false;
  }
};

export const getCalculatorInputs = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CALCULATOR_INPUTS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.log('Get calculator inputs error:', error);
    return {};
  }
};
