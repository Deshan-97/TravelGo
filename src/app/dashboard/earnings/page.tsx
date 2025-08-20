
'use client';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, CreditCard, Send } from "lucide-react"
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function EarningsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [statusFilter, setStatusFilter] = useState('All');
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (user) {
            // Get all completed hires for total earnings
            const hiresQuery = query(
                collection(db, 'hires'),
                where('ownerId', '==', user.uid),
                where('status', '==', 'Completed')
            );
            const unsubHires = onSnapshot(hiresQuery, (snapshot) => {
                const earnings = snapshot.docs.reduce((acc, doc) => acc + doc.data().price, 0);
                setTotalEarnings(earnings);
            });

            // Get commission payments
            const paymentsQuery = query(
                collection(db, 'commissions'),
                where('ownerId', '==', user.uid)
            );
             const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
                const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPayments(paymentsData);
                setIsLoading(false);
            });

            return () => {
                unsubHires();
                unsubPayments();
            };
        } else if (user === null) {
            setIsLoading(false);
        }
    }, [user]);

    const handleNotify = async (paymentId: string) => {
        const paymentRef = doc(db, 'commissions', paymentId);
        await updateDoc(paymentRef, { status: 'Notified' });
        toast({ title: "Admin Notified", description: "The admin has been notified of your payment." });
    };
    
    const totalCommission = payments.reduce((acc, p) => acc + p.commission, 0);
    const commissionPaid = payments.reduce((acc, p) => p.status === 'Paid' ? acc + p.commission : acc, 0);
    const commissionDue = totalCommission - commissionPaid;

    const filteredPayments = payments.filter(payment => 
        statusFilter === 'All' || payment.status === statusFilter
    );

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Earnings & Commission
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {totalEarnings.toFixed(2)}</div> }
                        <p className="text-xs text-muted-foreground">From all completed hires</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
                        <CreditCard className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-green-500">Rs. {commissionPaid.toFixed(2)}</div> }
                        <p className="text-xs text-muted-foreground">Confirmed by admin</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Commission Due</CardTitle>
                        <CreditCard className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-destructive">Rs. {commissionDue.toFixed(2)}</div> }
                        <p className="text-xs text-muted-foreground">Total outstanding commission</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="w-full">
                            <CardTitle>Commission Payments</CardTitle>
                            <CardDescription>Track and manage your commission payments for each hire.</CardDescription>
                        </div>
                         <div className="w-full md:w-48">
                            <Label>Filter by status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Due">Due</SelectItem>
                                    <SelectItem value="Notified">Notified</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hire ID</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead className="text-right">Hire Amount</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Action</TableHead>
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
                            ) : filteredPayments.length > 0 ? (
                                filteredPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>
                                        <div className="font-mono text-xs">{payment.hireId}</div>
                                        <div className="text-xs text-muted-foreground sm:hidden">{format(new Date(payment.date.toDate()), 'PPP')}</div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{format(new Date(payment.date.toDate()), 'PPP')}</TableCell>
                                    <TableCell className="text-right font-medium">Rs. {payment.amount.toFixed(2)}</TableCell>
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
                                        {payment.status === 'Due' ? (
                                             <Button variant="outline" size="sm" onClick={() => handleNotify(payment.id)}>
                                                <Send className="mr-2 h-3 w-3"/>
                                                Notify Paid
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">--</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No payments found for the selected status.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
