
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, DollarSign, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type AppUser = {
    uid: string;
    name: string;
    phone: string;
}

type Hire = {
    id: string;
    ownerId: string;
    ownerName: string;
    price: number;
    status: 'Upcoming' | 'Active' | 'Completed';
    completedAt?: any; 
}

type UserReport = {
    user: AppUser;
    totalHires: number;
    totalAmount: number;
}

const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
}

export default function UserHireHistoryPage() {
    const router = useRouter();
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allHires, setAllHires] = useState<Hire[]>([]);
    const [filteredReport, setFilteredReport] = useState<UserReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date(),
    });

    useEffect(() => {
        // Fetch all users
        const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersArray = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
            setAllUsers(usersArray);
        });
        
        // Fetch all hires
        const hiresUnsub = onSnapshot(collection(db, 'hires'), (snapshot) => {
            const hiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hire));
            setAllHires(hiresData);
            setIsLoading(false);
        });

        return () => {
            usersUnsub();
            hiresUnsub();
        }
    }, []);

    useEffect(() => {
        const generateReport = () => {
            if (!dateRange || !dateRange.from || !dateRange.to || isLoading) {
                setFilteredReport([]);
                return;
            }

            const completedHires = allHires.filter(hire => hire.status === 'Completed' && hire.completedAt);

            const filtered = completedHires.filter(hire => {
                const hireDate = hire.completedAt.toDate();
                return isWithinInterval(hireDate, { start: dateRange.from!, end: dateRange.to! });
            });
            
            const reportMap = new Map<string, UserReport>();

            allUsers.forEach(user => {
                reportMap.set(user.uid, {
                    user,
                    totalHires: 0,
                    totalAmount: 0,
                });
            });

            filtered.forEach(hire => {
                if (reportMap.has(hire.ownerId)) {
                    const report = reportMap.get(hire.ownerId)!;
                    report.totalHires += 1;
                    report.totalAmount += hire.price;
                }
            });

            const finalReport = Array.from(reportMap.values()).filter(r => r.totalHires > 0).sort((a,b) => b.totalAmount - a.totalAmount);
            setFilteredReport(finalReport);
        };

        generateReport();
    }, [dateRange, allUsers, allHires, isLoading]);

    const totalHires = filteredReport.reduce((acc, r) => acc + r.totalHires, 0);
    const totalAmount = filteredReport.reduce((acc, r) => acc + r.totalAmount, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        User Hire History
                    </h1>
                </div>
                <div className="w-full md:w-auto">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
            </div>

             <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <User className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{filteredReport.length}</div> }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
                        <Hash className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                         { isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalHires}</div> }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                         { isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">Rs. {totalAmount.toFixed(2)}</div> }
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Report</CardTitle>
                    <CardDescription>A summary of completed hires and earnings per user for the selected date range.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="text-center">Hires</TableHead>
                                <TableHead className="text-right">Amount (Rs.)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                       <div className="space-y-2">
                                            <Skeleton className="h-6 w-full" />
                                            <Skeleton className="h-6 w-full" />
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredReport.length > 0 ? (
                                filteredReport.map((report) => (
                                    <TableRow key={report.user.uid}>
                                        <TableCell className="font-medium flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={`https://placehold.co/40x40.png`} alt={report.user.name} />
                                                <AvatarFallback>{getInitials(report.user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold">{report.user.name}</div>
                                                <div className="text-xs text-muted-foreground">{report.user.phone}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">{report.totalHires}</TableCell>
                                        <TableCell className="text-right font-mono">{report.totalAmount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No hire data available for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
