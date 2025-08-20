
"use client"
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle } from "./add-vehicle-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type EditVehicleDialogProps = {
    vehicle: Vehicle;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
}

const allServices = [
    'Airport Transfer',
    'Wedding Hire',
    'Wedding Car',
    'Tourist Hire',
    'Long-Distance Trip',
    'Special Occasion Hire'
];

const vehicleBrands = [
    "Toyota", "Nissan", "Honda", "Suzuki", "Mitsubishi", "Kia", "Hyundai", "Mazda", "Ford", "Tata", "Mahindra", "Isuzu", "BMW", "Mercedes-Benz", "Audi", "Land Rover", "Jaguar", "Micro"
];

const geocodeLocation = async (location: string) => {
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&countrycodes=lk&format=json&limit=1`;
    try {
        const response = await fetch(endpoint, { headers: { 'User-Agent': 'TravelGO/1.0 (travelgo@example.com)' } });
        if (!response.ok) throw new Error("Failed to geocode location");
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}


export function EditVehicleDialog({ vehicle, open, onOpenChange, onUpdateVehicle }: EditVehicleDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Vehicle>(vehicle);
    const [services, setServices] = useState<string[]>(vehicle.services);

    useEffect(() => {
        setFormData(vehicle);
        setServices(vehicle.services);
    }, [vehicle]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'year' || name === 'passengers' ? Number(value) : value } as Vehicle));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value } as Vehicle));
    };

    const handleServiceChange = (service: string, checked: boolean) => {
        if (checked) {
            setServices(prev => [...prev, service]);
        } else {
            setServices(prev => prev.filter(s => s !== service));
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (services.length === 0) {
            toast({ variant: "destructive", title: "Service Required", description: "Please select at least one service." });
            setIsSubmitting(false);
            return;
        }

        let updatedVehicleData = { ...formData, services };

        // If location changed, re-geocode
        if (formData.location !== vehicle.location) {
             const coordinates = await geocodeLocation(formData.location);
             if (!coordinates) {
                toast({ variant: "destructive", title: "Invalid Location", description: `Could not find coordinates for "${formData.location}". Please enter a valid location.` });
                setIsSubmitting(false);
                return;
            }
            updatedVehicleData.coordinates = coordinates;
        }


        try {
            await onUpdateVehicle(updatedVehicleData);
            toast({ title: "Vehicle Updated", description: "Your vehicle details have been successfully updated." });
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating vehicle:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update vehicle. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Edit Vehicle</DialogTitle>
                    <DialogDescription>
                        Update the details of your vehicle.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-[60vh] md:h-auto pr-6">
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="vehicle-type" className="text-right">Type</Label>
                                <Select name="type" required value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                                    <SelectTrigger className="col-span-3" id="vehicle-type">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Car">Car</SelectItem>
                                        <SelectItem value="Van">Van</SelectItem>
                                        <SelectItem value="Bus">Bus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="brand" className="text-right">Brand</Label>
                                <Select name="brand" required value={formData.brand} onValueChange={(value) => handleSelectChange('brand', value)}>
                                    <SelectTrigger className="col-span-3" id="brand">
                                        <SelectValue placeholder="Select a brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicleBrands.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ac-type" className="text-right">AC Type</Label>
                                <Select name="acType" required value={formData.acType} onValueChange={(value) => handleSelectChange('acType', value as 'AC' | 'Non-AC')}>
                                    <SelectTrigger className="col-span-3" id="ac-type">
                                        <SelectValue placeholder="Select AC or Non-AC" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AC">AC</SelectItem>
                                        <SelectItem value="Non-AC">Non-AC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="passengers" className="text-right">Passengers</Label>
                                <Input id="passengers" name="passengers" type="number" placeholder="e.g., 12" className="col-span-3" value={formData.passengers || ''} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="model" className="text-right">Model</Label>
                                <Input id="model" name="model" placeholder="e.g., KDH" className="col-span-3" value={formData.model} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="year" className="text-right">Year</Label>
                                <Input id="year" name="year" type="number" placeholder="e.g., 2023" className="col-span-3" value={formData.year} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="license" className="text-right">License</Label>
                                <Input id="license" name="license" placeholder="e.g., ABC-1234" className="col-span-3" value={formData.license} disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="service-location" className="text-right">Location</Label>
                                <Input id="service-location" name="location" placeholder="e.g., Colombo" className="col-span-3" value={formData.location} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Services</Label>
                                <div className="col-span-3 space-y-2">
                                    {allServices.map(service => (
                                         <div className="flex items-center space-x-2" key={service}>
                                            <Checkbox 
                                                id={`edit-${service.replace(/\s+/g, '-').toLowerCase()}`} 
                                                checked={services.includes(service)}
                                                onCheckedChange={(checked) => handleServiceChange(service, !!checked)}
                                            />
                                            <Label htmlFor={`edit-${service.replace(/\s+/g, '-').toLowerCase()}`} className="font-normal">{service}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
