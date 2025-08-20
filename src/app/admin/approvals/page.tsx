
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, User, Phone, CarIcon, X, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApprovalsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [approvals, setApprovals] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'requests'), where('status', '==', 'offered'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Fetch owner details for each request
            const enrichedApprovals = await Promise.all(requestsData.map(async (request) => {
                const ownerDocRef = doc(db, "users", request.ownerId);
                const ownerDoc = await getDoc(ownerDocRef);
                const ownerData = ownerDoc.exists() ? ownerDoc.data() : { name: 'Unknown', phone: 'N/A' };
                return { ...request, ownerData };
            }));

            setApprovals(enrichedApprovals);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApproval = async (request: any, status: 'Approved' | 'Declined') => {
        const requestRef = doc(db, 'requests', request.id);
        
        if (status === 'Approved') {
            const batch = writeBatch(db);
            try {
                // Owner name is already fetched and available in request.ownerData
                const ownerName = request.ownerData?.name || 'Unknown Owner';

                // Create a new document in the 'hires' collection
                const hireRef = doc(collection(db, 'hires'));

                // Exclude the old request ID and ownerData from the data to be saved in the new hire document
                const { id, ownerData, ...requestData } = request;

                batch.set(hireRef, {
                    ...requestData,
                    status: 'Upcoming', 
                    approvedAt: serverTimestamp(),
                    ownerName: ownerName,
                    price: request.offerPrice,
                });

                // Delete the original request, it is no longer needed
                batch.delete(requestRef);
                
                await batch.commit();
                toast({ title: 'Hire Approved!', description: `Hire request has been approved and moved to Confirmed Hires.` });

            } catch (error) {
                 console.error("Error approving hire: ", error);
                 toast({ variant: 'destructive', title: 'Approval Failed', description: 'Could not approve the hire. Please check logs.' });
            }
        } else {
            // Just update the status to declined if it's not approved.
            await updateDoc(requestRef, { status: 'declined' });
            toast({ variant: 'destructive', title: 'Hire Declined', description: `Hire request has been declined.` });
        }
    };

    const formatDateRange = (start: any, end: any) => {
        const startDate = start.toDate();
        const endDate = end.toDate();
        return `${format(startDate, 'PPP')} - ${format(endDate, 'PPP')}`;
    }

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Hire Approvals
                </h1>
            </div>

            {isLoading ? (
                 <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : approvals.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {approvals.map((request) => (
                        <Card key={request.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="font-headline">{request.vehicleInfo.model}</CardTitle>
                                        <CardDescription>Hire Request</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-base font-bold text-primary border-primary">Rs. {request.offerPrice.toFixed(2)}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                    <div><strong>Customer:</strong> {request.customer.name} ({request.customer.phone})</div>
                                    <div><strong>Dates:</strong> {formatDateRange(request.pickupDate, request.dropoffDate)}</div>
                                    <div><strong>Service:</strong> <Badge variant="outline">{request.serviceType}</Badge></div>
                                     <div><strong>Passengers:</strong> {request.passengers}</div>
                                    <div><strong>Pick-up:</strong> {request.pickupLocation}</div>
                                    <div><strong>Drop-off:</strong> {request.dropLocation}</div>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-md">
                                     <h4 className="font-semibold mb-2 text-xs uppercase text-muted-foreground">Owner & Vehicle Info</h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2"><User className="h-3 w-3"/>{request.ownerData.name}</div>
                                        <div className="flex items-center gap-2"><Phone className="h-3 w-3"/>{request.ownerData.phone}</div>
                                        <div className="flex items-center gap-2"><CarIcon className="h-3 w-3"/>{request.vehicleInfo.license}</div>
                                        <div className="flex items-center gap-2"><CarIcon className="h-3 w-3"/>{request.vehicleInfo.type}</div>
                                     </div>
                                </div>
                                {request.remark && <p className="pt-2 text-muted-foreground italic"><strong>Remark:</strong> "{request.remark}"</p>}
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button className="w-full" size="sm" onClick={() => handleApproval(request, 'Approved')}>
                                    <Check className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button className="w-full" size="sm" variant="destructive" onClick={() => handleApproval(request, 'Declined')}>
                                    <X className="mr-2 h-4 w-4" /> Decline
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>There are no pending hire approvals at the moment.</p>
                </div>
            )}
        </div>
    );
}
