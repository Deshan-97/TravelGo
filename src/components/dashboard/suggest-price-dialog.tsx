
'use client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";

const formSchema = z.object({
  offerPrice: z.coerce.number({required_error: "Please enter an offer price."}).positive("Offer price must be positive."),
});

type SuggestPriceDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: any;
    onOfferSubmit: (requestId: string, offerDetails: any) => void;
}

export function SuggestPriceDialog({ open, onOpenChange, request, onOfferSubmit }: SuggestPriceDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            offerPrice: 0,
        },
    });

    const offerPrice = form.watch('offerPrice');
    const commission = offerPrice * 0.05;

    function onSubmit(values: z.infer<typeof formSchema>) {
        const offerDetails = {
            ...request,
            offerPrice: values.offerPrice
        };
        
        setIsSubmitting(true);
        setTimeout(() => {
            onOfferSubmit(request.id, offerDetails);
            setIsSubmitting(false);
            onOpenChange(false);
        }, 1000);
    }
    
    const formatDateRange = (start: any, end: any) => {
        if (!start || !end) return "N/A";
        return `${format(start.toDate(), 'PPP')} - ${format(end.toDate(), 'PPP')}`;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Respond to Hire Request</DialogTitle>
                    <DialogDescription>
                        Review the details and enter your offer for this hire.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <ScrollArea className="h-[60vh] md:h-auto pr-4 -mr-4">
                            <div className="space-y-6 rounded-md border p-4 bg-muted/50">
                                {/* Hire Details */}
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Hire Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                                        <div><strong>Dates:</strong> {formatDateRange(request.pickupDate, request.dropoffDate)}</div>
                                        <div><strong>Duration:</strong> {request.duration} day(s)</div>
                                        <div><strong>Service:</strong> <Badge variant="outline">{request.serviceType}</Badge></div>
                                        <div><strong>Pick-up:</strong> {request.pickupLocation}</div>
                                        <div><strong>Drop-off:</strong> {request.dropLocation}</div>
                                        <div><strong>Pick-up Time:</strong> {request.pickupTime}</div>
                                        <div><strong>Drop-off Time:</strong> {request.dropoffTime}</div>
                                        <div><strong>Passengers:</strong> {request.passengers}</div>
                                        <div><strong>AC Status:</strong> <Badge variant="secondary">{request.acType}</Badge></div>
                                    </div>
                                    {request.remark && <p className="text-sm pt-3 text-muted-foreground italic"><strong>Remark:</strong> "{request.remark}"</p>}
                                </div>

                                <Separator />

                                {/* Customer Details */}
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Customer Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                                        <div><strong>Name:</strong> {request.customer.name}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 space-y-4">
                                <FormField control={form.control} name="offerPrice" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Offer Price (Rs.)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} placeholder="Enter your offer" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="space-y-2">
                                    <Label>Commission (5%)</Label>
                                    <Input
                                        readOnly
                                        value={`Rs. ${commission.toFixed(2)}`}
                                        className="bg-muted border-dashed"
                                    />
                                    <p className="text-xs text-muted-foreground">This is the 5% commission that will be deducted from your offer.</p>
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Offer
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
