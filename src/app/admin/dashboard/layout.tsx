
'use client'
import type { Metadata } from 'next';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, Wallet, UserCheck, Users, FileText, ChevronDown, Settings, Car } from 'lucide-react';
import { UserNav } from '@/components/dashboard/user-nav';
import { LogoIcon } from '@/components/icons/logo';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function AdminSidebarLinks() {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const [isReportsOpen, setIsReportsOpen] = useState(pathname.includes('/admin/reports'));

    const handleLinkClick = () => {
        setOpenMobile(false);
    }
    
    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/admin/dashboard'}>
                        <Link href="/admin/dashboard" onClick={handleLinkClick}><Home /><span>Dashboard</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Approvals" isActive={pathname === '/admin/approvals'}>
                        <Link href="/admin/approvals" onClick={handleLinkClick}><UserCheck /><span>Approvals</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Commissions" isActive={pathname === '/admin/commissions'}>
                        <Link href="/admin/commissions" onClick={handleLinkClick}><Wallet /><span>Commissions</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Users" isActive={pathname === '/admin/users'}>
                        <Link href="/admin/users" onClick={handleLinkClick}><Users /><span>User Management</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                                <FileText />
                                <span>Reports</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                    </SidebarMenuItem>
                        <CollapsibleContent>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={pathname === '/admin/reports'}>
                                    <Link href="/admin/reports" onClick={handleLinkClick}>Upcoming Hires</Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={pathname === '/admin/reports/user-hires'}>
                                    <Link href="/admin/reports/user-hires" onClick={handleLinkClick}>User Hire History</Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={pathname === '/admin/reports/vehicle-details'}>
                                    <Link href="/admin/reports/vehicle-details" onClick={handleLinkClick}>Vehicle Details</Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        </SidebarMenuSub>
                        </CollapsibleContent>
                </Collapsible>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Utilities" isActive={pathname === '/admin/utils'}>
                        <Link href="/admin/utils" onClick={handleLinkClick}><Settings /><span>Utilities</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    )
}


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            if (!isAdmin) {
                router.replace('/admin/login');
            }
        }
    }, [isMounted, router]);

    if (!isMounted) {
        return null; 
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 p-2">
                        <LogoIcon className="h-8 w-8 text-primary" />
                        <h2 className="text-2xl font-bold text-primary font-headline group-data-[collapsible=icon]:hidden">Travel GO <span className='text-base font-normal text-muted-foreground'>Admin</span></h2>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                   <AdminSidebarLinks />
                </SidebarContent>
            </Sidebar>
            <SidebarInset className="h-svh">
                <header className="flex items-center justify-between p-4 border-b h-16 sticky top-0 bg-background/80 backdrop-blur-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                    </div>
                    <UserNav isAdmin={true}/>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
