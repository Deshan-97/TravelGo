import { useState } from 'react';
import { Bell, Check, CheckCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

export function NotificationBell() {
  const { 
    isSupported, 
    isEnabled, 
    notifications, 
    unreadCount, 
    enableNotifications, 
    sendTestNotification,
    markAsRead,
    markAllAsRead 
  } = useNotifications();
  const { toast } = useToast();
  const [showEnableDialog, setShowEnableDialog] = useState(false);

  const handleEnableNotifications = async () => {
    const success = await enableNotifications();
    if (success) {
      toast({
        title: "Notifications Enabled!",
        description: "You'll now receive updates about your vehicle hire requests."
      });
      setShowEnableDialog(false);
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Enable Notifications",
        description: "Please check your browser settings and try again."
      });
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    toast({
      title: "Test Notification Sent!",
      description: "Check your notifications to see if it worked."
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_request':
        return '📋';
      case 'hire_accepted':
        return '✅';
      case 'hire_started':
        return '🚗';
      case 'hire_completed':
        return '🏁';
      case 'payment_received':
        return '💰';
      default:
        return '📱';
    }
  };

  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, h:mm a');
  };

  if (!isSupported) {
    return null; // Don't show anything if notifications aren't supported
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex gap-2">
              {!isEnabled && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEnableDialog(true)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3 w-3" />
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {!isEnabled && (
            <>
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">Enable notifications to get updates about your vehicle hire requests!</p>
                <Button size="sm" onClick={() => setShowEnableDialog(true)}>
                  Enable Notifications
                </Button>
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet
                {isEnabled && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={handleTestNotification}>
                      Send Test
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              notifications.map((notification: any) => (
                <DropdownMenuItem 
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-4 cursor-pointer ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground self-end">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Push Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Get instant notifications when you receive new hire requests, bookings are confirmed, or payments are received. 
              You can disable this anytime in your browser settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not Now</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableNotifications}>
              Enable Notifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
