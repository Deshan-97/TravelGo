import { db } from '@/lib/firebase';
import { pushNotificationService, NotificationData } from '@/lib/push-notifications';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export class DashboardNotificationService {
  
  // Send notification when a new hire request is received
  static async notifyNewHireRequest(ownerId: string, requestData: any) {
    const notification: NotificationData = {
      title: 'New Hire Request! 🚗',
      body: `You have a new ${requestData.serviceType} request from ${requestData.name}`,
      type: 'new_request',
      userId: ownerId,
      data: {
        requestId: requestData.id,
        serviceType: requestData.serviceType,
        pickupLocation: requestData.pickupLocation,
        pickupDate: requestData.pickupDate
      }
    };

    await this.sendNotification(notification);
  }

  // Send notification when a hire is accepted/confirmed
  static async notifyHireAccepted(ownerId: string, hireData: any) {
    const notification: NotificationData = {
      title: 'Hire Request Accepted! ✅',
      body: `Your offer for ${hireData.customerName} has been accepted. Payment: Rs. ${hireData.price}`,
      type: 'hire_accepted',
      userId: ownerId,
      data: {
        hireId: hireData.id,
        customerName: hireData.customerName,
        price: hireData.price,
        pickupDate: hireData.pickupDate
      }
    };

    await this.sendNotification(notification);
  }

  // Send notification when a hire is started
  static async notifyHireStarted(ownerId: string, hireData: any) {
    const notification: NotificationData = {
      title: 'Hire Started! 🚗',
      body: `Your hire with ${hireData.customerName} has begun. Have a safe trip!`,
      type: 'hire_started',
      userId: ownerId,
      data: {
        hireId: hireData.id,
        customerName: hireData.customerName,
        vehicleDetails: hireData.vehicleDetails
      }
    };

    await this.sendNotification(notification);
  }

  // Send notification when a hire is completed
  static async notifyHireCompleted(ownerId: string, hireData: any) {
    const notification: NotificationData = {
      title: 'Hire Completed! 🏁',
      body: `Your hire with ${hireData.customerName} is complete. Earnings: Rs. ${hireData.price}`,
      type: 'hire_completed',
      userId: ownerId,
      data: {
        hireId: hireData.id,
        customerName: hireData.customerName,
        price: hireData.price,
        commission: hireData.commission
      }
    };

    await this.sendNotification(notification);
  }

  // Send notification for payment received
  static async notifyPaymentReceived(ownerId: string, paymentData: any) {
    const notification: NotificationData = {
      title: 'Payment Received! 💰',
      body: `You received Rs. ${paymentData.amount} for hire #${paymentData.hireId}`,
      type: 'payment_received',
      userId: ownerId,
      data: {
        amount: paymentData.amount,
        hireId: paymentData.hireId,
        paymentMethod: paymentData.method
      }
    };

    await this.sendNotification(notification);
  }

  // Send general dashboard notifications
  static async notifyGeneral(ownerId: string, title: string, body: string, data?: any) {
    const notification: NotificationData = {
      title,
      body,
      type: 'general',
      userId: ownerId,
      data
    };

    await this.sendNotification(notification);
  }

  // Private method to send notification
  private static async sendNotification(notification: NotificationData) {
    try {
      // Store in Firestore for in-app notifications
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false
      });

      // Send push notification (this will be handled by the service)
      await pushNotificationService.sendNotification(notification);
      
      console.log('Notification sent:', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Batch notifications for multiple users
  static async sendBulkNotification(userIds: string[], title: string, body: string, type: NotificationData['type'] = 'general', data?: any) {
    const notifications = userIds.map(userId => ({
      title,
      body,
      type,
      userId,
      data,
      createdAt: serverTimestamp(),
      read: false
    }));

    try {
      // Store all notifications in Firestore
      const promises = notifications.map(notification => 
        addDoc(collection(db, 'notifications'), notification)
      );
      
      await Promise.all(promises);
      console.log(`Bulk notification sent to ${userIds.length} users`);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
    }
  }
}

// Helper function to trigger notifications based on Firestore changes
export function setupNotificationTriggers(userId: string) {
  // This would typically be set up in your backend or via Firestore triggers
  // For now, we'll manually call these functions when data changes
  
  console.log('Notification triggers set up for user:', userId);
}
