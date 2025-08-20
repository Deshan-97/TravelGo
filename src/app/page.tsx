
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Car, Check, Clock, DollarSign, Facebook, Handshake, Instagram, MapPin, Phone, Shield, Users } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { addDays, format, isWithinInterval, startOfDay } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, Timestamp, getDoc, doc } from "firebase/firestore"
import { DashboardNotificationService } from "@/lib/dashboard-notifications"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { LogoIcon } from "@/components/icons/logo"

const bookingFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  contactNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit contact number."),
  serviceType: z.string({ required_error: "Please select a service type." }),
  vehicleType: z.string({ required_error: "Please select a vehicle type." }),
  acType: z.string({ required_error: "Please select an AC type." }),
  pickupLocation: z.string().min(2, "Pickup location is required."),
  pickupDate: z.date({ required_error: "A pickup date is required." }),
  dropoffDate: z.date({ required_error: "A drop-off date is required." }),
  pickupTime: z.string({ required_error: "A pickup time is required." }),
  dropoffTime: z.string().optional(),
  dropLocation: z.string().optional(),
  passengers: z.coerce.number().int().min(1, "Must have at least 1 passenger."),
  remark: z.string().optional(),
}).refine(data => data.dropoffDate >= data.pickupDate, {
    message: "Drop-off date cannot be earlier than pickup date.",
    path: ["dropoffDate"],
}).superRefine((data, ctx) => {
    if (data.serviceType !== 'Long-Distance Trip' && data.serviceType !== 'Tourist Hire') {
        if (!data.dropLocation || data.dropLocation.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Drop-off location is required.",
                path: ["dropLocation"],
            });
        }
         if (!data.dropoffTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A drop-off time is required.",
                path: ["dropoffTime"],
            });
        }
    }
});


export default function HomePage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<{lat: number, lon: number} | null>(null);
  const [pickupDateOpen, setPickupDateOpen] = useState(false);
  const [dropoffDateOpen, setDropoffDateOpen] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  
  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      pickupLocation: "",
      dropLocation: "",
      contactNumber: "",
      passengers: 1,
      remark: "",
      dropoffTime: "",
    },
  })

  const serviceType = form.watch('serviceType');
  const isDropOffOptional = serviceType === 'Long-Distance Trip' || serviceType === 'Tourist Hire';

 const fetchLocationSuggestions = useCallback(async (query: string, field: 'pickupLocation' | 'dropLocation') => {
    if (query.length < 3) {
      field === 'pickupLocation' ? setPickupSuggestions([]) : setDropoffSuggestions([]);
      return;
    }
    
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=lk&format=json&limit=15&accept-language=en`;

    try {
        const response = await fetch(endpoint, {
            headers: { 'User-Agent': 'TravelGO/1.0 (travelgo@example.com)' }
        });
        if (!response.ok) throw new Error('Failed to fetch');
        let data = await response.json();
        
        // Filter results to only include cities, towns, or villages
        const allowedTypes = ['city', 'town', 'village'];
        data = data.filter((place: any) => allowedTypes.includes(place.type));

        if (field === 'pickupLocation') {
            setPickupSuggestions(data);
        } else {
            setDropoffSuggestions(data);
        }
    } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        field === 'pickupLocation' ? setPickupSuggestions([]) : setDropoffSuggestions([]);
    }
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'pickupLocation' | 'dropLocation') => {
    const value = e.target.value;
    form.setValue(field, value);
    if (field === 'pickupLocation') setSelectedPickup(null);

    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
        fetchLocationSuggestions(value, field);
    }, 500); // 500ms debounce delay
  };


  const selectSuggestion = (place: any, field: 'pickupLocation' | 'dropLocation') => {
    form.setValue(field, place.display_name);
    if (field === 'pickupLocation') {
      setSelectedPickup({ lat: parseFloat(place.lat), lon: parseFloat(place.lon) });
      setPickupSuggestions([]);
    } else {
      setDropoffSuggestions([]);
    }
  };

  // Haversine formula to calculate distance between two lat/lon points
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  async function onSubmit(values: z.infer<typeof bookingFormSchema>) {
    setIsSubmitting(true);
    
    if (!selectedPickup) {
        toast({ variant: "destructive", title: "Invalid Location", description: "Please select a pickup location from the suggestions." });
        setIsSubmitting(false);
        return;
    }

    try {
        const vehiclesRef = collection(db, "vehicles");
        const q = query(
            vehiclesRef,
            where("type", "==", values.vehicleType),
            where("acType", "==", values.acType),
            where("services", "array-contains", values.serviceType)
        );

        const querySnapshot = await getDocs(q);
        const allMatchingVehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const vehiclesWithEnoughSeats = allMatchingVehicles.filter(vehicle => 
            vehicle.passengers && vehicle.passengers >= values.passengers
        );

        const unavailabilityRef = collection(db, "unavailability");
        const unavailabilitySnapshot = await getDocs(unavailabilityRef);
        const unavailabilityData: { [key: string]: string[] } = {};
        unavailabilitySnapshot.forEach(doc => {
            unavailabilityData[doc.id] = doc.data().dates;
        });

        const dateFilteredVehicles = vehiclesWithEnoughSeats.filter(vehicle => {
            const unavailableDates = unavailabilityData[vehicle.id] || [];
            const bookingRange = { start: startOfDay(values.pickupDate), end: startOfDay(values.dropoffDate) };

            for (const dateStr of unavailableDates) {
                const unavailableDate = startOfDay(new Date(dateStr));
                if (isWithinInterval(unavailableDate, bookingRange)) {
                    return false; 
                }
            }
            return true; 
        });

        // Filter vehicles by 30km radius
        const availableVehicles = dateFilteredVehicles.filter(vehicle => {
            if (vehicle.coordinates && vehicle.coordinates.lat && vehicle.coordinates.lon) {
                const distance = getDistance(
                    selectedPickup.lat,
                    selectedPickup.lon,
                    vehicle.coordinates.lat,
                    vehicle.coordinates.lon
                );
                return distance <= 30; // 30km radius
            }
            return false; // Don't include vehicles without coordinates
        });


        if (availableVehicles.length > 0) {
            const pickupTimestamp = Timestamp.fromDate(values.pickupDate);
            const dropoffTimestamp = Timestamp.fromDate(values.dropoffDate);
            const diffTime = Math.abs(values.dropoffDate.getTime() - values.pickupDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const requestPromises = availableVehicles.map(async (vehicle) => {
                const newRequest = {
                    customer: { name: values.name, phone: values.contactNumber },
                    vehicleId: vehicle.id,
                    ownerId: vehicle.ownerId,
                    vehicleInfo: {
                        model: vehicle.model,
                        license: vehicle.license,
                        type: vehicle.type,
                        year: vehicle.year,
                        passengers: vehicle.passengers,
                        location: vehicle.location,
                    },
                    pickupDate: pickupTimestamp,
                    dropoffDate: dropoffTimestamp,
                    duration: diffDays, 
                    serviceType: values.serviceType,
                    acType: values.acType,
                    pickupLocation: values.pickupLocation,
                    dropLocation: values.dropLocation || 'N/A',
                    pickupTime: values.pickupTime,
                    dropoffTime: values.dropoffTime || 'N/A',
                    passengers: values.passengers,
                    remark: values.remark,
                    status: 'pending', 
                    createdAt: Timestamp.now(),
                };
                
                // Save the request first
                const docRef = await addDoc(collection(db, "requests"), newRequest);
                
                // Send notification to vehicle owner 🔔
                await DashboardNotificationService.notifyNewHireRequest(vehicle.ownerId, {
                    ...newRequest,
                    id: docRef.id,
                    name: values.name // Add name for notification
                });
                
                return docRef;
            });

            await Promise.all(requestPromises);

            toast({
                title: "Booking Submitted!",
                description: "We've sent your request to available vehicle owners. You will be notified upon confirmation.",
            });
            form.reset();
        } else {
            toast({
                variant: "destructive",
                title: "No Vehicles Available",
                description: "We couldn't find any vehicles that match your criteria for the selected dates and location radius. Please try different options.",
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message || "There was an error submitting your booking. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <Header />
      <main className="flex-1">
        <section className="relative w-full h-[70vh] md:h-[80vh]">
            <Image 
                src="https://images.unsplash.com/photo-1533106418989-88406e7923b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzY2VuaWMlMjBoaWdod2F5JTIwbW91bnRhaW5zfGVufDB8fHx8MTc1NTA4Mzk0MHww&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Modern car driving on a scenic road at sunset" 
                fill
                priority
                className="absolute inset-0 z-0 object-cover"
                data-ai-hint="scenic highway mountains"
            />
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-2xl">Your Journey, Your Way</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto drop-shadow-xl">
                    Find the perfect vehicle for any occasion. From city cruisers to spacious vans for group adventures, we've got you covered.
                </p>
                <Button size="lg" className="mt-8" onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}>
                    Book Now
                </Button>
            </div>
        </section>

        <section id="booking" className="w-full py-16 md:py-24 lg:py-32 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">Get a Quote in Minutes</h2>
                    <p className="mt-2 text-lg text-muted-foreground">Fill out the form below to find available vehicles.</p>
                </div>
                <Card className="p-6 md:p-8 shadow-lg">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="contactNumber" render={({ field }) => (
                                <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="0712345678" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="serviceType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Airport Transfer">Airport Transfer</SelectItem>
                                        <SelectItem value="Wedding Hire">Wedding Hire</SelectItem>
                                        <SelectItem value="Wedding Car">Wedding Car</SelectItem>
                                        <SelectItem value="Tourist Hire">Tourist Hire</SelectItem>
                                        <SelectItem value="Long-Distance Trip">Long-Distance Trip</SelectItem>
                                        <SelectItem value="Special Occasion Hire">Special Occasion Hire</SelectItem>
                                        <SelectItem value="Custom">Other</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="vehicleType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vehicle Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a vehicle type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Car">Car</SelectItem>
                                        <SelectItem value="Van">Van</SelectItem>
                                        <SelectItem value="Bus">Bus</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="acType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>AC / Non-AC</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="AC">AC</SelectItem>
                                        <SelectItem value="Non-AC">Non-AC</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="passengers" render={({ field }) => (
                                <FormItem><FormLabel>Number of Passengers</FormLabel><FormControl><Input type="number" placeholder="e.g. 4" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="pickupLocation" render={({ field }) => (
                                <FormItem className="relative"><FormLabel>Pickup Location</FormLabel><FormControl><Input placeholder="e.g., Colombo" {...field} onChange={(e) => handleLocationChange(e, 'pickupLocation')} autoComplete="off" /></FormControl>
                                {pickupSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-background border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {pickupSuggestions.map(place => (
                                            <div key={place.place_id} onClick={() => selectSuggestion(place, 'pickupLocation')} className="p-2 cursor-pointer hover:bg-muted">{place.display_name}</div>
                                        ))}
                                    </div>
                                )}
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dropLocation" render={({ field }) => (
                                <FormItem className="relative">
                                    <FormLabel>Drop-off Location {isDropOffOptional && '(Optional)'}</FormLabel>
                                    <FormControl><Input placeholder="e.g., Kandy" {...field} onChange={(e) => handleLocationChange(e, 'dropLocation')} autoComplete="off" /></FormControl>
                                {dropoffSuggestions.length > 0 && (
                                     <div className="absolute z-10 w-full bg-background border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {dropoffSuggestions.map(place => (
                                            <div key={place.place_id} onClick={() => selectSuggestion(place, 'dropLocation')} className="p-2 cursor-pointer hover:bg-muted">{place.display_name}</div>
                                        ))}
                                    </div>
                                )}
                                <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="pickupDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Pickup Date</FormLabel>
                                    <Popover open={pickupDateOpen} onOpenChange={setPickupDateOpen}>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={(date) => {field.onChange(date); setPickupDateOpen(false);}} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                             )} />
                              <FormField control={form.control} name="dropoffDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Drop-off Date</FormLabel>
                                    <Popover open={dropoffDateOpen} onOpenChange={setDropoffDateOpen}>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={(date) => {field.onChange(date); setDropoffDateOpen(false);}} disabled={(date) => date < (form.getValues("pickupDate") || new Date(new Date().setHours(0,0,0,0)))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                             )} />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField control={form.control} name="pickupTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pickup Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="dropoffTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Drop-off Time {isDropOffOptional && '(Optional)'}</FormLabel>
                                     <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="remark" render={({ field }) => (
                            <FormItem><FormLabel>Remark (Optional)</FormLabel><FormControl><Textarea placeholder="Any special requests? e.g., need a baby seat." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Find a Vehicle
                        </Button>
                    </form>
                </Form>
                </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">How It Works</h2>
                    <p className="mt-2 text-lg text-muted-foreground">Booking your ride is as easy as 1-2-3.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                            <Car className="w-8 h-8"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">1. Search</h3>
                        <p className="text-muted-foreground">Enter your trip details to find available vehicles from our trusted local owners.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                         <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                            <Check className="w-8 h-8"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">2. Book</h3>
                        <p className="text-muted-foreground">Receive a competitive quote and confirm your booking in just a few clicks.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                         <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                            <Handshake className="w-8 h-8"/>
                        </div>
                        <h3 className="text-xl font-bold mb-2">3. Drive</h3>
                        <p className="text-muted-foreground">Meet your driver at the agreed location and enjoy your journey with peace of mind.</p>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="w-full py-16 md:py-24 lg:py-32 bg-muted/20">
            <div className="container px-4 md:px-6">
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1 text-sm">Why Choose Us?</div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
                           The Travel GO Advantage
                        </h2>
                        <p className="text-lg text-muted-foreground">
                           We are more than just a booking platform. We're a community-driven service committed to providing you with the best vehicle hire experience.
                        </p>
                         <ul className="grid gap-4 mt-6">
                            <li className="flex items-start gap-4">
                                <DollarSign className="w-6 h-6 mt-1 text-primary"/>
                                <div>
                                    <h3 className="text-xl font-bold">Transparent Pricing</h3>
                                    <p className="text-muted-foreground">No hidden fees. Get fair and competitive quotes directly from vehicle owners.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-4">
                                <Shield className="w-6 h-6 mt-1 text-primary"/>
                                <div>
                                    <h3 className="text-xl font-bold">Safety and Reliability</h3>
                                    <p className="text-muted-foreground">All vehicles are vetted, and all hires are managed by our professional team to ensure your safety.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-4">
                                <Users className="w-6 h-6 mt-1 text-primary"/>
                                <div>
                                    <h3 className="text-xl font-bold">Support Local</h3>
                                    <p className="text-muted-foreground">Your booking directly supports local vehicle owners and entrepreneurs in your community.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="hidden lg:flex items-center justify-center">
                       <Image
                        src="https://images.unsplash.com/photo-1608121908007-2a9c662f0a22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHx0cmlwJTIwdmFufGVufDB8fHx8MTc1NTA4Mzg5OXww&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Happy customer with a rental car"
                        width={600}
                        height={600}
                        className="rounded-xl object-cover"
                        data-ai-hint="happy customer car"
                       />
                    </div>
                </div>
            </div>
        </section>

      </main>
      <footer className="w-full shrink-0 border-t bg-card text-card-foreground">
        <div className="container px-4 md:px-6 py-8">
            <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <LogoIcon className="h-8 w-8 text-primary" />
                         <h3 className="text-2xl font-bold font-headline text-primary">Travel GO</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Your premium vehicle hire partner. Connecting you with safe, reliable, and affordable transport solutions.</p>
                </div>
                <div className="md:text-center">
                     <h4 className="font-semibold mb-2">Quick Links</h4>
                     <nav className="flex flex-col gap-1 text-sm">
                        <Link href="/" className="hover:text-primary hover:underline underline-offset-4">Home</Link>
                        <Link href="/about" className="hover:text-primary hover:underline underline-offset-4">About Us</Link>
                         <Link href="/login" className="hover:text-primary hover:underline underline-offset-4">Owner Login</Link>
                    </nav>
                </div>
                <div className="md:text-right">
                    <h4 className="font-semibold mb-2">Contact Us</h4>
                    <div className="flex items-center md:justify-end gap-2 text-sm mb-2">
                        <Phone className="h-4 w-4" />
                        <a href="tel:0774588143" className="font-semibold hover:underline">077 458 8143</a>
                    </div>
                     <div className="flex items-center md:justify-end gap-3">
                        <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
                    </div>
                </div>
            </div>
            <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
                <p>&copy; 2024 Travel GO. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

    

    



