
'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Briefcase, Handshake, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
    const [user, loading] = useAuthState(auth);
    const [userName, setUserName] = useState('Vehicle Owner');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        vehicleCount: 0,
        pendingRequests: 0,
        activeHires: 0,
        totalEarnings: 0
    });

    useEffect(() => {
        if (user) {
            setUserName(user.displayName || 'Vehicle Owner');
            const initialStats = { vehicleCount: 0, pendingRequests: 0, activeHires: 0, totalEarnings: 0 };
            let loadedQueries = 0;
            const totalQueries = 3;

            const onQueriesLoaded = () => {
                loadedQueries++;
                if (loadedQueries === totalQueries) {
                    setIsLoading(false);
                }
            };

            // Vehicle Count
            const vehiclesQuery = query(collection(db, "vehicles"), where("ownerId", "==", user.uid));
            const unsubVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
                setStats(prev => ({ ...prev, vehicleCount: snapshot.size }));
                onQueriesLoaded();
            });

            // Pending Requests
            const requestsQuery = query(collection(db, "requests"), where("ownerId", "==", user.uid), where("status", "==", "pending"));
            const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
                setStats(prev => ({ ...prev, pendingRequests: snapshot.size }));
                onQueriesLoaded();
            });

            // Active Hires & Total Earnings
            const hiresQuery = query(collection(db, "hires"), where("ownerId", "==", user.uid));
            const unsubHires = onSnapshot(hiresQuery, (snapshot) => {
                let activeHires = 0;
                let totalEarnings = 0;
                snapshot.forEach(doc => {
                    const hire = doc.data();
                    if (hire.status === 'Active') {
                        activeHires++;
                    }
                    if (hire.status === 'Completed') {
                        totalEarnings += hire.price || 0;
                    }
                });
                setStats(prev => ({ ...prev, activeHires, totalEarnings }));
                onQueriesLoaded();
            });

            return () => {
                unsubVehicles();
                unsubRequests();
                unsubHires();
            }
        } else if (!loading) {
            setIsLoading(false);
        }
    }, [user, loading])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Welcome back, {userName}!
                </h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                        <Car className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.vehicleCount}</div>}
                        <p className="text-xs text-muted-foreground">Ready for hire</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Briefcase className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.pendingRequests}</div>}
                        <p className="text-xs text-muted-foreground">Awaiting your response</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Hires</CardTitle>
                        <Handshake className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.activeHires}</div>}
                        <p className="text-xs text-muted-foreground">Currently in progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">Rs. {stats.totalEarnings.toFixed(2)}</div>}
                        <p className="text-xs text-muted-foreground">From all completed hires</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
