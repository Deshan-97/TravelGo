import { db } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface NotificationData {
  title: string;
  body: string;
  type: 'new_request' | 'hire_accepted' | 'hire_started' | 'hire_completed' | 'payment_received' | 'general';
  data?: any;
  userId: string;
}

class PushNotificationService {
  private vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY; // You'll need to generate this

  // Request permission and get push subscription
  async requestPermission(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);

      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }

      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription if none exists
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.vapidKey || undefined
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      return null;
    }
  }

  // Save push subscription to Firestore
  async savePushSubscription(userId: string, subscription: PushSubscription) {
    try {
      await setDoc(doc(db, 'pushSubscriptions', userId), {
        subscription: subscription.toJSON(),
        userId,
        createdAt: serverTimestamp(),
        active: true
      });
      console.log('Push subscription saved for user:', userId);
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  // Send notification (this would typically be called from your backend)
  async sendNotification(notificationData: NotificationData) {
    try {
      // Store notification in Firestore for tracking
      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false
      });

      // In a real app, you'd call your backend API here to send the push notification
      // For now, we'll simulate a local notification
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            data: notificationData.data,
            tag: notificationData.type
          });
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Helper function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show browser notification (for immediate feedback)
  async showBrowserNotification(title: string, body: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon.svg',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
  }

  // Check if push notifications are supported and enabled
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }
}

export const pushNotificationService = new PushNotificationService();
