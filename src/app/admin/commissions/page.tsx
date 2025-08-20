
'use client';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


export default function CommissionsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "commissions"), (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPayments(paymentsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleConfirmPayment = async (paymentId: string) => {
        const paymentRef = doc(db, 'commissions', paymentId);
        try {
            await updateDoc(paymentRef, { status: 'Paid' });
            toast({
                title: "Payment Confirmed",
                description: `Commission has been marked as paid.`,
            });
        } catch (error) {
            console.error("Error confirming payment: ", error);
             toast({
                variant: 'destructive',
                title: "Confirmation Failed",
                description: `Could not confirm payment.`,
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Commission Payments
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Commission</CardTitle>
                    <CardDescription>Review and confirm commission payments from vehicle owners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hire ID</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {[...Array(3)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                            <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                                            <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : payments.length > 0 ? (
                                payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>
                                        <div className="font-mono text-xs">{payment.hireId}</div>
                                         <div className="text-xs text-muted-foreground md:hidden">{format(new Date(payment.date.toDate()), 'PPP')}</div>
                                    </TableCell>
                                    <TableCell>{payment.ownerName}</TableCell> 
                                    <TableCell className="hidden md:table-cell">{format(new Date(payment.date.toDate()), 'PPP')}</TableCell>
                                    <TableCell className="text-right font-medium text-primary">Rs. {payment.commission.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={payment.status === 'Paid' ? 'secondary' : payment.status === 'Notified' ? 'default' : 'outline'}
                                            className={
                                                payment.status === 'Paid' ? 'bg-green-600 text-white' :
                                                payment.status === 'Notified' ? 'bg-blue-500 text-white' : ''
                                            }
                                        >
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {payment.status === 'Notified' ? (
                                             <Button variant="outline" size="sm" onClick={() => handleConfirmPayment(payment.id)}>
                                                <CheckCircle className="mr-2 h-3 w-3"/>
                                                Confirm
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">--</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No commission payments found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
