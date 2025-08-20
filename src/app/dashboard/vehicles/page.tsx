
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddVehicleDialog, Vehicle } from "@/components/dashboard/add-vehicle-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { EditVehicleDialog } from "@/components/dashboard/edit-vehicle-dialog";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [user, loading] = useAuthState(auth);
    const [isLoading, setIsLoading] = useState(true);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, "vehicles"), where("ownerId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const vehiclesData: Vehicle[] = [];
                querySnapshot.forEach((doc) => {
                    vehiclesData.push({ id: doc.id, ...doc.data() } as Vehicle);
                });
                setVehicles(vehiclesData);
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else if (!loading) {
            setIsLoading(false);
        }
    }, [user, loading]);

    const addVehicle = (vehicle: Vehicle) => {
        // This is now handled by AddVehicleDialog directly writing to Firestore
        // The onSnapshot listener will automatically update the UI
    }

    const handleDelete = async (vehicleId: string | null) => {
        if (!vehicleId) return;
        await deleteDoc(doc(db, "vehicles", vehicleId));
        setVehicleToDelete(null);
    };

    const handleUpdateVehicle = async (vehicle: Vehicle) => {
        if (!vehicle.id) return;
        const vehicleRef = doc(db, 'vehicles', vehicle.id);
        const { id, ...vehicleData } = vehicle;
        await updateDoc(vehicleRef, vehicleData);
        setEditingVehicle(null);
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    My Vehicles
                </h1>
                <AddVehicleDialog onAddVehicle={addVehicle} />
            </div>

            {isLoading ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="flex flex-col">
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-4 w-28" />
                                <div className="flex flex-wrap gap-1 pt-1">
                                   <Skeleton className="h-5 w-24" />
                                   <Skeleton className="h-5 w-20" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            ) : (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((vehicle) => (
                        <Card key={vehicle.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">{vehicle.brand} {vehicle.model}</CardTitle>
                                <CardDescription>{vehicle.year} &bull; {vehicle.type} &bull; {vehicle.acType} {vehicle.passengers ? `(${vehicle.passengers} seats)` : ''}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2">
                                <Badge variant="secondary">{vehicle.license}</Badge>
                                <div className="text-sm text-muted-foreground">{vehicle.location}</div>
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {vehicle.services.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button variant="outline" className="w-full" onClick={() => setEditingVehicle(vehicle)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <AlertDialog open={vehicleToDelete === vehicle.id} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full" onClick={() => setVehicleToDelete(vehicle.id!)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the
                                            vehicle from your list.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(vehicleToDelete)}>
                                            Continue
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
             {!isLoading && vehicles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-lg font-semibold">No vehicles found.</p>
                    <p>Click "Add Vehicle" to get started.</p>
                </div>
            )}
            {editingVehicle && (
                <EditVehicleDialog
                    vehicle={editingVehicle}
                    open={!!editingVehicle}
                    onOpenChange={() => setEditingVehicle(null)}
                    onUpdateVehicle={handleUpdateVehicle}
                />
            )}
        </div>
    )
}
