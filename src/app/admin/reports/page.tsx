
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval } from 'date-fns';
import { HireSummaryDialog } from '@/components/admin/hire-summary-dialog';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type Hire = {
    id: string;
    customer: { name: string, phone: string };
    vehicleInfo: any;
    ownerName: string;
    pickupDate: any;
    dropoffDate: any,
    price: number;
    commission?: number;
    status: 'Upcoming' | 'Active' | 'Completed';
    pickupLocation: string;
    dropLocation: string;
    pickupTime: string;
    duration: number;
    passengers: number;
    serviceType: string;
    remark?: string;
}

export default function AdminReportsPage() {
    const router = useRouter();
    const [allUpcomingHires, setAllUpcomingHires] = useState<Hire[]>([]);
    const [filteredHires, setFilteredHires] = useState<Hire[]>([]);
    const [selectedHire, setSelectedHire] = useState<Hire | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    });

     useEffect(() => {
        const q = query(collection(db, 'hires'), where('status', '==', 'Upcoming'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const hiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hire));
            setAllUpcomingHires(hiresData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const filterHires = () => {
            if (!dateRange || !dateRange.from || !dateRange.to) {
                setFilteredHires(allUpcomingHires);
                return;
            }
            
            const filtered = allUpcomingHires.filter(hire => {
                const hireDate = hire.pickupDate.toDate();
                return isWithinInterval(hireDate, { start: dateRange.from!, end: dateRange.to! });
            });
            setFilteredHires(filtered);
        };

        filterHires();
    }, [dateRange, allUpcomingHires]);

    const formatDateRange = (start: any, end: any) => {
        if (!start || !end) return "N/A";
        return `${format(start.toDate(), 'PPP')} - ${format(end.toDate(), 'PPP')}`;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        Upcoming Hires
                    </h1>
                </div>
                <div className="w-full md:w-auto">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Approved & Upcoming Hires</CardTitle>
                    <CardDescription>A list of all hires that are scheduled to start within the selected date range.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden md:table-cell">Hire ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead className="hidden sm:table-cell">Dates</TableHead>
                                <TableHead className="text-right">Price</TableHead>
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
                                            <Skeleton className="h-6 w-full" />
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredHires.length > 0 ? (
                                filteredHires.map((hire) => (
                                    <TableRow key={hire.id}>
                                        <TableCell className="font-mono text-xs hidden md:table-cell">{hire.id}</TableCell>
                                        <TableCell className="font-medium">{hire.customer.name}</TableCell>
                                        <TableCell>{hire.vehicleInfo.model}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{formatDateRange(hire.pickupDate, hire.dropoffDate)}</TableCell>
                                        <TableCell className="text-right">Rs. {hire.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedHire(hire)}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View Details</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        There are no upcoming hires in the selected date range.
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
    );
}
