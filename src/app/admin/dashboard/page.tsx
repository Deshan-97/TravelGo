
'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Clock, CheckCircle, Handshake, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { format, isToday } from 'date-fns';
import { collection, query, where, onSnapshot, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCommission: 0,
        pendingApprovals: 0,
        activeOwners: 0,
        activeHires: 0,
        hiresStartedToday: 0,
        commissionToday: 0,
    });

    useEffect(() => {
        let loadedQueries = 0;
        const totalQueries = 3;

        const onQueriesLoaded = () => {
            loadedQueries++;
            if (loadedQueries === totalQueries) {
                setIsLoading(false);
            }
        };

        // Active Owners
        const usersQuery = query(collection(db, "users"), where("status", "==", "active"));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            setStats(prev => ({ ...prev, activeOwners: snapshot.size }));
            onQueriesLoaded();
        });

        // Pending Approvals
        const approvalsQuery = query(collection(db, "requests"), where("status", "==", "offered"));
        const unsubApprovals = onSnapshot(approvalsQuery, (snapshot) => {
            setStats(prev => ({ ...prev, pendingApprovals: snapshot.size }));
            onQueriesLoaded();
        });

        // Hires stats
        const hiresQuery = query(collection(db, "hires"));
        const unsubHires = onSnapshot(hiresQuery, (snapshot) => {
            let totalRevenue = 0;
            let totalCommission = 0;
            let activeHires = 0;
            let hiresStartedToday = 0;
            let commissionToday = 0;
            const today = new Date();

            snapshot.forEach(doc => {
                const hire = doc.data();
                if (hire.status === 'Completed') {
                    totalRevenue += hire.price || 0;
                    totalCommission += hire.commission || 0;
                     if (hire.completedAt && isToday(hire.completedAt.toDate())) {
                        commissionToday += hire.commission || 0;
                    }
                }
                if (hire.status === 'Active') {
                    activeHires++;
                }
                if (hire.startedAt && isToday(hire.startedAt.toDate())) {
                    hiresStartedToday++;
                }
            });

            setStats(prev => ({
                ...prev,
                totalRevenue,
                totalCommission,
                activeHires,
                hiresStartedToday,
                commissionToday,
            }));
            onQueriesLoaded();
        });


        return () => {
            unsubUsers();
            unsubApprovals();
            unsubHires();
        };

    }, [])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Admin Dashboard
                </h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {stats.totalRevenue.toFixed(2)}</div> }
                        <p className="text-xs text-muted-foreground">From all completed hires</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
                        <CheckCircle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {stats.totalCommission.toFixed(2)}</div> }
                        <p className="text-xs text-muted-foreground">5% of total revenue</p>
                    </CardContent>
                </Card>
                 <Link href="/admin/approvals">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <Clock className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            { isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.pendingApprovals}</div> }
                            <p className="text-xs text-muted-foreground">Hire requests to approve</p>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/admin/users">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Vehicle Owners</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                             { isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.activeOwners}</div> }
                            <p className="text-xs text-muted-foreground">Currently on the platform</p>
                        </CardContent>
                    </Card>
                 </Link>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Hires</CardTitle>
                        <Handshake className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.activeHires}</div> }
                        <p className="text-xs text-muted-foreground">Hires currently in progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hires Started Today</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.hiresStartedToday}</div> }
                        <p className="text-xs text-muted-foreground">On {format(new Date(), 'PPP')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Commission</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                         { isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {stats.commissionToday.toFixed(2)}</div> }
                        <p className="text-xs text-muted-foreground">From hires completed today</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
