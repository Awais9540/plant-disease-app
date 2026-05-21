import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for local notifications.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
      });
    }

    return true;
  } catch (err) {
    console.warn('Error configuring push notifications permissions:', err);
    return false;
  }
}

/**
 * Schedules a local push notification.
 * 
 * @param {string} title - Title of the notification
 * @param {string} body - Content body
 * @param {number} seconds - Trigger delay in seconds
 */
export async function scheduleLocalNotification(title, body, seconds = 1) {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds <= 0 ? null : { seconds },
    });
    return id;
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
    return null;
  }
}

/**
 * Cancels all currently scheduled local notifications.
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Failed to cancel notifications:', err);
  }
}
