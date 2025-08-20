
'use client'
import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Vehicle } from "@/components/dashboard/add-vehicle-dialog"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { collection, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

type Unavailability = {
    dates: string[] // storing dates as ISO strings
}

export default function AvailabilityPage() {
    const { toast } = useToast()
    const [user] = useAuthState(auth)
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>()
    const [dates, setDates] = useState<Date[] | undefined>([])
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            const q = collection(db, 'vehicles');
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const userVehicles = snapshot.docs
                    .filter(doc => doc.data().ownerId === user.uid)
                    .map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
                setVehicles(userVehicles);
                setIsLoadingVehicles(false);
            });
            return () => unsubscribe();
        } else if (user === null) {
            setIsLoadingVehicles(false);
        }
    }, [user]);

    useEffect(() => {
        const fetchUnavailability = async () => {
            if (selectedVehicleId) {
                const unavailabilityRef = doc(db, 'unavailability', selectedVehicleId);
                const docSnap = await getDoc(unavailabilityRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as Unavailability;
                    setDates(data.dates.map(d => new Date(d)));
                } else {
                    setDates([]);
                }
            } else {
                setDates([]);
            }
        };
        fetchUnavailability();
    }, [selectedVehicleId]);

    const handleSaveAvailability = async () => {
        if (!selectedVehicleId) {
            toast({
                variant: 'destructive',
                title: 'No Vehicle Selected',
                description: 'Please select a vehicle before saving.',
            })
            return;
        }
        setIsSaving(true);
        const unavailabilityRef = doc(db, 'unavailability', selectedVehicleId);
        const datesToSave = dates?.map(d => d.toISOString()) ?? [];

        try {
            await setDoc(unavailabilityRef, { dates: datesToSave });
            toast({
                title: 'Availability Saved!',
                description: `Unavailable dates for ${vehicles.find(v => v.id === selectedVehicleId)?.model} have been updated.`,
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error Saving',
                description: 'Could not save availability. Please try again.',
            })
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Manage Availability
            </h1>
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Unavailable Dates</CardTitle>
                             <CardDescription>Select a vehicle and then mark the dates it is unavailable for hire.</CardDescription>
                            <div className="pt-2">
                                <Label htmlFor="vehicle-select">Vehicle</Label>
                                { isLoadingVehicles ? <Skeleton className="h-10 w-full md:w-1/2" /> : (
                                    <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                                        <SelectTrigger id="vehicle-select" className="w-full md:w-1/2">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map(vehicle => (
                                                <SelectItem key={vehicle.id} value={vehicle.id!}>
                                                    {vehicle.model} ({vehicle.license})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="multiple"
                                min={1}
                                selected={dates}
                                onSelect={setDates}
                                className="rounded-md border"
                                disabled={!selectedVehicleId || isSaving}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Selected Dates</CardTitle>
                            <CardDescription>These dates will be marked as unavailable.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {dates && dates.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                {dates
                                .sort((a,b) => a.getTime() - b.getTime())
                                .map(date => (
                                    <div key={date.toString()} className="text-sm p-2 rounded-md bg-muted">
                                        {format(date, 'PPP')}
                                    </div>
                                ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">{selectedVehicleId ? 'No dates selected from the calendar.' : 'Please select a vehicle first.'}</p>}
                        </CardContent>
                        {dates && dates.length > 0 && (
                             <CardFooter className="flex-col items-stretch gap-2">
                                 <Button onClick={handleSaveAvailability} disabled={isSaving}>Save Availability</Button>
                                 <Button variant="outline" onClick={() => setDates([])} disabled={isSaving}>Clear Selection</Button>
                            </CardFooter>
                        )}
                     </Card>
                </div>
            </div>
        </div>
    )
}
