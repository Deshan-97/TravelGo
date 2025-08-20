
"use client"
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { format } from "date-fns";

type Hire = {
    id: string;
    customer: { name: string, phone: string };
    vehicleInfo: any; 
    pickupDate: any;
    dropoffDate: any;
    price: number;
    pickupLocation: string;
    dropLocation: string;
    pickupTime: string;
    dropoffTime?: string;
    duration: number;
    passengers: number;
    serviceType: string;
    remark?: string;
    ownerName?: string;
    acType?: string;
}

type HireSummaryDialogProps = {
    hire: Hire;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HireSummaryDialog({ hire, open, onOpenChange }: HireSummaryDialogProps) {
    const formatDateRange = (start: any, end: any) => {
        if (!start || !end) return "N/A";
        return `${format(start.toDate(), 'PPP')} - ${format(end.toDate(), 'PPP')}`;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Hire Summary - {hire.id}</DialogTitle>
                    <DialogDescription>
                        A detailed summary of the upcoming hire.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-6 rounded-md border p-4 bg-muted/50 max-h-[60vh] overflow-y-auto">
                    {/* Hire Details */}
                    <div>
                        <h4 className="font-semibold text-lg mb-2">Hire Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                            <div><strong>Dates:</strong> {formatDateRange(hire.pickupDate, hire.dropoffDate)}</div>
                            <div><strong>Duration:</strong> {hire.duration} day(s)</div>
                            <div><strong>Service:</strong> <Badge variant="outline">{hire.serviceType}</Badge></div>
                            <div><strong>Pick-up:</strong> {hire.pickupLocation}</div>
                            <div><strong>Drop-off:</strong> {hire.dropLocation}</div>
                             <div><strong>AC Status:</strong> <Badge variant="secondary">{hire.acType || 'N/A'}</Badge></div>
                            <div><strong>Pick-up Time:</strong> {hire.pickupTime}</div>
                            <div><strong>Drop-off Time:</strong> {hire.dropoffTime || 'N/A'}</div>
                            <div><strong>Passengers:</strong> {hire.passengers}</div>
                            <div className="md:col-span-3"><strong>Price:</strong> <Badge className="text-base font-bold text-primary border-primary" variant="outline">Rs. {hire.price.toFixed(2)}</Badge></div>
                        </div>
                        {hire.remark && <p className="text-sm pt-3 text-muted-foreground italic"><strong>Remark:</strong> "{hire.remark}"</p>}
                    </div>

                    <Separator />

                    {/* Customer Details */}
                    <div>
                         <h4 className="font-semibold text-lg mb-2">Customer Details</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                            <div><strong>Name:</strong> {hire.customer.name}</div>
                            <div><strong>Contact:</strong> {hire.customer.phone}</div>
                        </div>
                    </div>

                    <Separator />

                     {/* Vehicle & Owner Details */}
                    <div>
                         <h4 className="font-semibold text-lg mb-2">Vehicle & Owner Details</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                            <div><strong>Owner:</strong> {hire.ownerName || 'N/A'}</div>
                            <div><strong>Vehicle:</strong> {hire.vehicleInfo.model} ({hire.vehicleInfo.year})</div>
                            <div><strong>License Plate:</strong> <Badge variant="secondary">{hire.vehicleInfo.license}</Badge></div>
                            <div><strong>Type:</strong> {hire.vehicleInfo.type}</div>
                            <div><strong>Seats:</strong> {hire.vehicleInfo.passengers}</div>
                            <div><strong>Base Location:</strong> {hire.vehicleInfo.location}</div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
