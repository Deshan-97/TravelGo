
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuggestPriceDialog } from '@/components/dashboard/suggest-price-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardNotificationService } from '@/lib/dashboard-notifications';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, "requests"), 
                where("ownerId", "==", user.uid),
                where("status", "==", "pending")
            );
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const requestsData: any[] = [];
                querySnapshot.forEach((doc) => {
                    requestsData.push({ id: doc.id, ...doc.data() });
                });
                setRequests(requestsData);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else if (user === null) {
            setIsLoading(false);
        }
    }, [user]);

    const handleOfferSubmit = async (requestId: string, offerDetails: any) => {
        try {
            const requestRef = doc(db, "requests", requestId);
            await updateDoc(requestRef, {
                status: 'offered',
                offerPrice: offerDetails.offerPrice,
                commission: offerDetails.offerPrice * 0.05,
                offerCreatedAt: Timestamp.now()
            });

            // 🔔 Send notification - offer submitted (for admin approval)
            if (user) {
                const request = requests.find(r => r.id === requestId);
                if (request) {
                    await DashboardNotificationService.notifyGeneral(
                        user.uid,
                        'Offer Submitted! ✅',
                        `Your offer of Rs. ${offerDetails.offerPrice} has been sent for approval.`,
                        { requestId, offerPrice: offerDetails.offerPrice }
                    );
                }
            }

            setSelectedRequest(null);
            toast({
                title: "Offer Submitted!",
                description: "Your offer has been sent to the admin for approval.",
            });
        } catch (error) {
            console.error("Error submitting offer: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not submit your offer. Please try again.'
            });
        }
    }

    const formatDateRange = (start: any, end: any) => {
        const startDate = start.toDate();
        const endDate = end.toDate();
        return `${format(startDate, 'PPP')} - ${format(endDate, 'PPP')}`;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Hire Requests
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
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : requests.length > 0 ? (
                 <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {requests.map((request) => (
                        <Card key={request.id}>
                            <CardHeader>
                                <CardTitle className="font-headline">{request.vehicleInfo.model}</CardTitle>
                                <CardDescription>Request from {request.customer.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                    <div><strong>Dates:</strong> {formatDateRange(request.pickupDate, request.dropoffDate)} ({request.duration} days)</div>
                                    <div className="flex items-center gap-2"><strong>Service:</strong> <Badge variant="outline">{request.serviceType}</Badge></div>
                                    <div><strong>Pick-up:</strong> {request.pickupLocation}</div>
                                    <div><strong>Drop-off:</strong> {request.dropLocation}</div>
                                    <div><strong>Pick-up time:</strong> {request.pickupTime}</div>
                                    <div><strong>Passengers:</strong> {request.passengers}</div>
                                </div>
                                {request.remark && <p className="pt-2 text-muted-foreground italic"><strong>Remark:</strong> "{request.remark}"</p>}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => setSelectedRequest(request)}>
                                    View & Respond
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-lg font-semibold">No new hire requests.</p>
                </div>
            )
            }

            {selectedRequest && (
                <SuggestPriceDialog 
                    open={!!selectedRequest}
                    onOpenChange={(open) => !open && setSelectedRequest(null)}
                    request={selectedRequest}
                    onOfferSubmit={handleOfferSubmit}
                />
            )}
        </div>
    )
}
