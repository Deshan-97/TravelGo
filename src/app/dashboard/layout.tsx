
'use client';
import type { Metadata } from 'next';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarMenuBadge, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, Car, CalendarClock, Briefcase, Handshake, Wallet, FileText } from 'lucide-react';
import { UserNav } from '@/components/dashboard/user-nav';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { LogoIcon } from '@/components/icons/logo';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';


function DashboardSidebarLinks({ pendingRequestsCount, activeHiresCount }: { pendingRequestsCount: number, activeHiresCount: number }) {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();

    const handleLinkClick = () => {
        setOpenMobile(false);
    }
    
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/dashboard'}>
                    <Link href="/dashboard" onClick={handleLinkClick}><Home /><span>Dashboard</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My Vehicles" isActive={pathname === '/dashboard/vehicles'}>
                    <Link href="/dashboard/vehicles" onClick={handleLinkClick}><Car /><span>My Vehicles</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Hire Requests" isActive={pathname === '/dashboard/requests'}>
                    <Link href="/dashboard/requests" onClick={handleLinkClick}><Briefcase /><span>Hire Requests</span></Link>
                    </SidebarMenuButton>
                    {pendingRequestsCount > 0 && <SidebarMenuBadge>{pendingRequestsCount}</SidebarMenuBadge>}
            </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Confirmed Hires" isActive={pathname === '/dashboard/hires'}>
                    <Link href="/dashboard/hires" onClick={handleLinkClick}><Handshake /><span>Confirmed Hires</span></Link>
                    </SidebarMenuButton>
                    {activeHiresCount > 0 && <SidebarMenuBadge>{activeHiresCount}</SidebarMenuBadge>}
            </SidebarMenuItem>
            <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Availability" isActive={pathname === '/dashboard/availability'}>
                    <Link href="/dashboard/availability" onClick={handleLinkClick}><CalendarClock /><span>Availability</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Earnings" isActive={pathname === '/dashboard/earnings'}>
                    <Link href="/dashboard/earnings" onClick={handleLinkClick}><Wallet /><span>Earnings</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Reports" isActive={pathname === '/dashboard/reports'}>
                    <Link href="/dashboard/reports" onClick={handleLinkClick}><FileText /><span>Reports</span></Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, loading] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();
    const [lastNotificationTimestamp, setLastNotificationTimestamp] = useState<Timestamp | null>(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [activeHiresCount, setActiveHiresCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
      // Set initial timestamp only on the client
      if (typeof window !== 'undefined' && !lastNotificationTimestamp) {
        const now = Timestamp.now();
        setLastNotificationTimestamp(now);
      }
    }, []);

    useEffect(() => {
        if (!isMounted || loading || !user) {
            return;
        }

        if (lastNotificationTimestamp) {
            const requestsQuery = query(
                collection(db, "requests"),
                where("ownerId", "==", user.uid),
                where("status", "==", "pending")
                // Using where("createdAt", ">", lastNotificationTimestamp) can be unreliable if client/server times differ.
                // A better approach for real-time notifications is often just fetching all pending and managing seen state on the client.
                // For simplicity, we'll fetch all pending requests.
            );

            const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
                const newRequests = snapshot.docChanges().filter(change => change.type === 'added');
                
                if (newRequests.length > 0) {
                    const latestRequest = newRequests[newRequests.length - 1].doc.data();
                    if (latestRequest.createdAt.toMillis() > lastNotificationTimestamp.toMillis()) {
                        toast({
                            title: "New Hire Request!",
                            description: `You have ${newRequests.length} new hire request(s).`,
                            action: (
                                <Button asChild size="sm">
                                   <Link href="/dashboard/requests">View</Link>
                                </Button>
                            ),
                        });
                        // Update the timestamp to the latest request to prevent re-notifying
                        setLastNotificationTimestamp(latestRequest.createdAt);
                    }
                }
                 setPendingRequestsCount(snapshot.size);
            });


            const hiresQuery = query(
                collection(db, "hires"),
                where("ownerId", "==", user.uid),
                 where('status', 'in', ['Upcoming', 'Active'])
            );

            const unsubscribeHires = onSnapshot(hiresQuery, (snapshot) => {
                setActiveHiresCount(snapshot.size);
            });

            return () => {
                unsubscribeRequests();
                unsubscribeHires();
            };
        }
    }, [user, loading, toast, lastNotificationTimestamp, isMounted]);

    useEffect(() => {
        if (isMounted && !loading && !user) {
            router.replace('/login');
        }
    }, [isMounted, loading, user, router]);


    if (!isMounted || loading || !user) {
      return null;
    }


    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <Link href="/dashboard" className="flex items-center gap-2 p-2">
                        <LogoIcon className="h-8 w-8 text-primary" />
                        <h2 className="text-2xl font-bold text-primary font-headline group-data-[collapsible=icon]:hidden">Travel GO</h2>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <DashboardSidebarLinks pendingRequestsCount={pendingRequestsCount} activeHiresCount={activeHiresCount} />
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="flex items-center justify-between p-4 border-b h-16 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <UserNav />
                    </div>
                </header>
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
