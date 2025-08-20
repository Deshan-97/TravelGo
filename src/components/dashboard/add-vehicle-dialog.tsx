
"use client"
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";


export type Vehicle = {
    id?: string;
    ownerId?: string;
    type: string;
    acType: 'AC' | 'Non-AC';
    brand: string;
    model: string;
    year: number;
    license: string;
    location: string;
    coordinates?: { lat: number, lon: number };
    services: string[];
    passengers?: number;
}

type AddVehicleDialogProps = {
    onAddVehicle: (vehicle: Vehicle) => void;
}

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


export function AddVehicleDialog({ onAddVehicle }: AddVehicleDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [vehicleType, setVehicleType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user] = useAuthState(auth);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to add a vehicle." });
            return;
        }
        
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const licenseInput = formData.get('license') as string;
        const locationInput = formData.get('location') as string;
        
        // Normalize the license plate for querying
        const normalizedLicense = licenseInput.replace(/\s+/g, '').toUpperCase();

        // Check for existing license plate
        const vehiclesRef = collection(db, "vehicles");
        const querySnapshot = await getDocs(query(vehiclesRef, where("license", "==", normalizedLicense)));

        if (!querySnapshot.empty) {
            toast({ variant: "destructive", title: "Duplicate Vehicle", description: `This vehicle number is already registered.` });
            setIsSubmitting(false);
            return;
        }

        // Geocode location
        const coordinates = await geocodeLocation(locationInput);
        if (!coordinates) {
             toast({ variant: "destructive", title: "Invalid Location", description: `Could not find coordinates for "${locationInput}". Please enter a valid location.` });
             setIsSubmitting(false);
             return;
        }


        const services: string[] = [];
        if (formData.get('airport-transfer') === 'on') services.push('Airport Transfer');
        if (formData.get('wedding-hire') === 'on') services.push('Wedding Hire');
        if (formData.get('wedding-car') === 'on') services.push('Wedding Car');
        if (formData.get('tourist-hire') === 'on') services.push('Tourist Hire');
        if (formData.get('long-distance-trip') === 'on') services.push('Long-Distance Trip');
        if (formData.get('special-occasion') === 'on') services.push('Special Occasion Hire');

        if (services.length === 0) {
            toast({ variant: "destructive", title: "Service Required", description: "Please select at least one service." });
            setIsSubmitting(false);
            return;
        }

        try {
            
            const newVehicle: Omit<Vehicle, 'id'> = {
                ownerId: user.uid,
                type: formData.get('type') as string,
                acType: formData.get('acType') as 'AC' | 'Non-AC',
                brand: formData.get('brand') as string,
                model: formData.get('model') as string,
                year: Number(formData.get('year')),
                license: normalizedLicense,
                location: locationInput,
                coordinates: coordinates,
                services: services,
                passengers: formData.has('passengers') ? Number(formData.get('passengers')) : undefined,
            }
            
            await addDoc(collection(db, "vehicles"), newVehicle);

            toast({ title: "Vehicle Added", description: "Your vehicle has been successfully added." });

            setOpen(false);
            e.currentTarget.reset();
            setVehicleType('');

        } catch (error) {
            console.error("Error adding vehicle:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add vehicle. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                // Reset form on close
                setVehicleType('');
            }
        }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Add New Vehicle</DialogTitle>
                    <DialogDescription>
                        Enter the details of your vehicle to make it available for hire.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-[60vh] pr-6">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="vehicle-type" className="text-right">Type</Label>
                                <Select name="type" required onValueChange={setVehicleType}>
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
                                <Select name="brand" required>
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
                                <Select name="acType" required>
                                    <SelectTrigger className="col-span-3" id="ac-type">
                                        <SelectValue placeholder="Select AC or Non-AC" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AC">AC</SelectItem>
                                        <SelectItem value="Non-AC">Non-AC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {(vehicleType === 'Van' || vehicleType === 'Bus' || vehicleType === 'Car') && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="passengers" className="text-right">Passengers</Label>
                                    <Input id="passengers" name="passengers" type="number" placeholder="e.g., 12" className="col-span-3" required />
                                </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="model" className="text-right">Model</Label>
                                <Input id="model" name="model" placeholder="e.g., KDH" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="year" className="text-right">Year</Label>
                                <Input id="year" name="year" type="number" placeholder="e.g., 2023" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="license" className="text-right">License</Label>
                                <Input id="license" name="license" placeholder="e.g., ABC-1234" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="service-location" className="text-right">Location</Label>
                                <Input id="service-location" name="location" placeholder="e.g., Colombo" className="col-span-3" required />
                            </div>
                            
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Services</Label>
                                <div className="col-span-3 space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="airport-transfer" name="airport-transfer" />
                                        <Label htmlFor="airport-transfer" className="font-normal">Airport Transfer</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="wedding-hire" name="wedding-hire" />
                                        <Label htmlFor="wedding-hire" className="font-normal">Wedding Hire</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="wedding-car" name="wedding-car" />
                                        <Label htmlFor="wedding-car" className="font-normal">Wedding Car</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="tourist-hire" name="tourist-hire" />
                                        <Label htmlFor="tourist-hire" className="font-normal">Tourist Hire</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="long-distance-trip" name="long-distance-trip" />
                                        <Label htmlFor="long-distance-trip" className="font-normal">Long-Distance Trip</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="special-occasion" name="special-occasion" />
                                        <Label htmlFor="special-occasion" className="font-normal">Special Occasion Hire</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Vehicle
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
