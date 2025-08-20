

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DateRange } from "react-day-picker";
import { format, isWithinInterval } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

export default function ReportsPage() {
    const [user] = useAuthState(auth);
    const [allHires, setAllHires] = useState<any[]>([]);
    const [filteredHires, setFilteredHires] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        to: new Date(),
    });

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, 'hires'),
                where('ownerId', '==', user.uid),
                where('status', '==', 'Completed')
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const hiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllHires(hiresData);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else if (user === null) {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const filterHires = () => {
            if (!dateRange || !dateRange.from || !dateRange.to) {
                setFilteredHires(allHires);
                return;
            }
            
            const filtered = allHires.filter(hire => {
                if (!hire.completedAt) return false;
                const hireDate = hire.completedAt.toDate();
                return isWithinInterval(hireDate, { start: dateRange.from!, end: dateRange.to! });
            });
            setFilteredHires(filtered);
        };

        filterHires();
    }, [dateRange, allHires]);

    const reportData = {
        totalHires: filteredHires.length,
        totalEarnings: filteredHires.reduce((acc, hire) => acc + hire.price, 0),
        totalCommission: filteredHires.reduce((acc, hire) => acc + (hire.commission || 0), 0),
        hires: filteredHires
    }

    const formatDateRange = (start: any, end: any) => {
        if (!start || !end) return "N/A";
        return `${format(start.toDate(), 'PPP')} - ${format(end.toDate(), 'PPP')}`;
    }

    const handleDownload = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("Hire Report", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Owner: ${user?.displayName || 'N/A'}`, 14, 30);
        doc.text(`Date Range: ${format(dateRange?.from || new Date(), 'LLL dd, y')} - ${format(dateRange?.to || new Date(), 'LLL dd, y')}`, 14, 37);


        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: [
                ['Total Hires', reportData.totalHires],
                ['Total Earnings (Rs.)', reportData.totalEarnings.toFixed(2)],
                ['Total Commission (Rs.)', reportData.totalCommission.toFixed(2)],
            ],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Hire ID', 'Customer', 'Vehicle', 'Dates', 'Price (Rs.)', 'Commission (Rs.)']],
            body: reportData.hires.map(hire => [
                hire.id,
                hire.customer.name,
                hire.vehicleInfo.model,
                formatDateRange(hire.pickupDate, hire.dropoffDate),
                hire.price.toFixed(2),
                (hire.commission || 0).toFixed(2)
            ]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        })

        doc.save(`TravelGO_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Reports
                </h1>
                <div className="flex items-center gap-4 flex-col sm:flex-row w-full sm:w-auto">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    <Button onClick={handleDownload} disabled={reportData.hires.length === 0 || isLoading} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Hires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-9 w-1/4" /> : <p className="text-3xl font-bold">{reportData.totalHires}</p> }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                         { isLoading ? <Skeleton className="h-9 w-3/4" /> : <p className="text-3xl font-bold">Rs. {reportData.totalEarnings.toFixed(2)}</p> }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Total Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                        { isLoading ? <Skeleton className="h-9 w-3/4" /> : <p className="text-3xl font-bold">Rs. {reportData.totalCommission.toFixed(2)}</p> }
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Completed Hires</CardTitle>
                    <CardDescription>A detailed list of completed hires in the selected date range.</CardDescription>
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
                                <TableHead className="text-right hidden md:table-cell">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/>
                                    </TableCell>
                                </TableRow>
                            ) : reportData.hires.length > 0 ? (
                                reportData.hires.map((hire) => (
                                    <TableRow key={hire.id}>
                                        <TableCell className="font-mono text-xs hidden md:table-cell">{hire.id}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{hire.customer.name}</div>
                                            <div className="text-sm text-muted-foreground sm:hidden">{formatDateRange(hire.pickupDate, hire.dropoffDate)}</div>
                                        </TableCell>
                                        <TableCell>{hire.vehicleInfo.model}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{formatDateRange(hire.pickupDate, hire.dropoffDate)}</TableCell>
                                        <TableCell className="text-right">
                                            <div>Rs. {hire.price.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground md:hidden">Comm: Rs. {(hire.commission || 0).toFixed(2)}</div>
                                        </TableCell>
                                        <TableCell className="text-right hidden md:table-cell">Rs. {(hire.commission || 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No completed hires found in the selected date range.
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
