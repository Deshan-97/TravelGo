import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';
import { DashboardNotificationService } from '@/lib/dashboard-notifications';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

export function NotificationDemo() {
  const { isEnabled, enableNotifications } = useNotifications();
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Send different types of test notifications
      await DashboardNotificationService.notifyNewHireRequest(user.uid, {
        id: 'test-123',
        name: 'John Doe',
        serviceType: 'Airport Transfer',
        pickupLocation: 'Colombo',
        pickupDate: new Date()
      });

      await DashboardNotificationService.notifyHireAccepted(user.uid, {
        id: 'hire-456',
        customerName: 'Jane Smith',
        price: 5000,
        pickupDate: new Date()
      });

      await DashboardNotificationService.notifyPaymentReceived(user.uid, {
        amount: 4750,
        hireId: 'hire-789',
        method: 'Bank Transfer'
      });

    } catch (error) {
      console.error('Error sending test notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🔔 Notification Center</CardTitle>
        <CardDescription>
          Test and manage your push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Push Notifications:</span>
          <span className={`text-xs px-2 py-1 rounded ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        {!isEnabled && (
          <Button onClick={enableNotifications} className="w-full">
            Enable Notifications
          </Button>
        )}
        
        {isEnabled && (
          <Button 
            onClick={sendTestNotifications} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Test Notifications'}
          </Button>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>You'll receive notifications for:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>New hire requests</li>
            <li>Accepted bookings</li>
            <li>Started/completed hires</li>
            <li>Payment confirmations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
