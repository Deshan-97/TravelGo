import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { pushNotificationService, NotificationData } from '@/lib/push-notifications';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

export function useNotifications() {
  const [user] = useAuthState(auth);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setIsSupported(pushNotificationService.isSupported());
    setIsEnabled(pushNotificationService.getPermissionStatus() === 'granted');
  }, []);

  // Listen for new notifications from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const enableNotifications = async () => {
    if (!user) return false;

    try {
      const subscription = await pushNotificationService.requestPermission();
      if (subscription) {
        await pushNotificationService.savePushSubscription(user.uid, subscription);
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;

    const testNotification: NotificationData = {
      title: 'Test Notification',
      body: 'This is a test notification from TravelGo!',
      type: 'general',
      userId: user.uid
    };

    await pushNotificationService.sendNotification(testNotification);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n: any) => !n.read);
    
    try {
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    isSupported,
    isEnabled,
    notifications,
    unreadCount,
    enableNotifications,
    sendTestNotification,
    markAsRead,
    markAllAsRead
  };
}
