
'use client';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, getDoc, writeBatch, getDocs, serverTimestamp } from "firebase/firestore";
import { format, isWithinInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { HireSummaryDialog } from "@/components/admin/hire-summary-dialog";
import { CheckCircle, Eye, Loader2, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardNotificationService } from "@/lib/dashboard-notifications";


export default function HiresPage() {
    const [hires, setHires] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [selectedHire, setSelectedHire] = useState<any | null>(null);
    const [updatingHireId, setUpdatingHireId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, 'hires'),
                where('ownerId', '==', user.uid),
                where('status', 'in', ['Upcoming', 'Active'])
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const hiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHires(hiresData);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } else if (user === null) {
            setIsLoading(false);
        }
    }, [user]);

    const handleStartHire = async (hire: any) => {
        setUpdatingHireId(hire.id);
        const hireRef = doc(db, 'hires', hire.id);
        const hireDoc = await getDoc(hireRef);

        if (!hireDoc.exists()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Hire document not found.' });
            setUpdatingHireId(null);
            return;
        }

        const hireData = hireDoc.data();
        if (!hireData.vehicleId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Vehicle ID is missing from hire data.' });
            setUpdatingHireId(null);
            return;
        }

        const batch = writeBatch(db);

        // Update the current hire to 'Active'
        batch.update(hireRef, {
            status: 'Active',
            startedAt: serverTimestamp()
        });

        // Find and reject conflicting requests
        const requestsRef = collection(db, "requests");
        const conflictingRequestsQuery = query(
            requestsRef,
            where("vehicleId", "==", hireData.vehicleId),
            where("status", "==", "pending")
        );

        try {
            const conflictingSnapshot = await getDocs(conflictingRequestsQuery);
            conflictingSnapshot.forEach(requestDoc => {
                const requestData = requestDoc.data();
                const requestStartDate = requestData.pickupDate.toDate();
                const hireStartDate = hireData.pickupDate.toDate();
                const hireEndDate = hireData.dropoffDate.toDate();
                if (isWithinInterval(requestStartDate, { start: hireStartDate, end: hireEndDate })) {
                    batch.update(doc(db, "requests", requestDoc.id), { status: 'rejected' });
                }
            });
            
            await batch.commit();
            
            // 🔔 Send notification - hire started
            if (user) {
                await DashboardNotificationService.notifyHireStarted(user.uid, {
                    id: hire.id,
                    customerName: hire.customerName || 'Customer',
                    vehicleDetails: `${hire.vehicleInfo?.model} (${hire.vehicleInfo?.license})`
                });
            }
            
            toast({ title: 'Hire Started!', description: 'The hire is now active and conflicting requests have been rejected.' });

        } catch (error) {
            console.error("Error starting hire:", error);
            toast({ variant: 'destructive', title: 'Error Starting Hire', description: 'Could not start the hire. Please try again.' });
        } finally {
            setUpdatingHireId(null);
        }
    };


    const handleEndHire = async (hireId: string) => {
        setUpdatingHireId(hireId);
        const hireRef = doc(db, 'hires', hireId);
        try {
            const hireDoc = await getDoc(hireRef);
            if (!hireDoc.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'Hire document is not found.' });
                setUpdatingHireId(null);
                return;
            }
            const hireData = hireDoc.data();
            const completionTimestamp = Timestamp.now();

            if (hireData) {
                 const batch = writeBatch(db);
                
                batch.update(hireRef, {
                    status: 'Completed',
                    completedAt: completionTimestamp
                });

                const commissionAmount = hireData.price * 0.05;
                const commissionRef = doc(collection(db, 'commissions'));
                batch.set(commissionRef, {
                    hireId: hireId,
                    ownerId: hireData.ownerId,
                    ownerName: hireData.ownerName,
                    amount: hireData.price,
                    commission: commissionAmount,
                    date: completionTimestamp,
                    status: 'Due',
                });

                await batch.commit();

                // 🔔 Send notification - hire completed
                if (user) {
                    await DashboardNotificationService.notifyHireCompleted(user.uid, {
                        id: hireId,
                        customerName: hireData.customerName || 'Customer',
                        price: hireData.price,
                        commission: commissionAmount
                    });
                }

                toast({ title: 'Hire Completed!', description: 'The hire has been marked as completed and commission has been generated.' });
            }
        } catch (error) {
            console.error("Error completing hire:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the hire. Please try again.' });
        } finally {
            setUpdatingHireId(null);
        }
    };

    const formatDateRange = (start: any, end: any) => {
        if (!start || !end) return "N/A";
        const startDate = start.toDate();
        const endDate = end.toDate();
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Confirmed Hires
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming & Active Hires</CardTitle>
                    <CardDescription>A list of your hires that are either upcoming or currently in progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead className="hidden sm:table-cell">Dates</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Price</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                       <div className="space-y-2">
                                            <Skeleton className="h-6 w-full" />
                                            <Skeleton className="h-6 w-full" />
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ) : hires.length > 0 ? hires.map((hire) => (
                                <TableRow key={hire.id}>
                                    <TableCell className="font-medium">
                                        <div>{hire.customer.name}</div>
                                        <div className="text-xs text-muted-foreground sm:hidden">{formatDateRange(hire.pickupDate, hire.dropoffDate)}</div>
                                        <div className="text-xs text-muted-foreground md:hidden">Rs. {hire.price.toFixed(2)}</div>
                                    </TableCell>
                                    <TableCell>{hire.vehicleInfo.model}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{formatDateRange(hire.pickupDate, hire.dropoffDate)}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={hire.status === 'Completed' ? 'secondary' : hire.status === 'Active' ? 'default' : 'outline'}
                                            className={hire.status === 'Active' ? 'bg-green-600 text-white' : ''}
                                        >
                                            {hire.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-right">Rs. {hire.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-center space-y-2 md:space-y-0 md:space-x-1">
                                         <Button variant="outline" size="sm" onClick={() => setSelectedHire(hire)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                        {hire.status === 'Upcoming' && 
                                            <Button size="sm" onClick={() => handleStartHire(hire)} disabled={updatingHireId === hire.id}>
                                                 {updatingHireId === hire.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlayCircle className="mr-2 h-4 w-4" />}
                                                Start
                                            </Button>
                                        }
                                        {hire.status === 'Active' && 
                                            <Button size="sm" variant="destructive" onClick={() => handleEndHire(hire.id)} disabled={updatingHireId === hire.id}>
                                                 {updatingHireId === hire.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                End
                                            </Button>
                                        }
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No active or upcoming hires.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             {selectedHire && (
                 <HireSummaryDialog
                    hire={selectedHire}
                    open={!!selectedHire}
                    onOpenChange={(open) => !open && setSelectedHire(null)}
                />
            )}
        </div>
    )
}
