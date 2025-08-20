
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, doc, getDoc, query, orderBy, startAfter, limit, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type Vehicle = {
    id: string;
    ownerId: string;
    type: string;
    brand: string;
    model: string;
    year: number;
    license: string;
    location: string;
};

type Owner = {
    name: string;
    phone: string;
};

type VehicleWithOwner = Vehicle & {
    owner: Owner;
};

const PAGE_SIZE = 10;

export default function VehicleDetailsReportPage() {
    const router = useRouter();
    const [allVehicles, setAllVehicles] = useState<VehicleWithOwner[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithOwner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchVehicles = async () => {
        setIsLoading(true);
        try {
            const firstBatch = query(collection(db, 'vehicles'), orderBy('brand'), limit(PAGE_SIZE));
            const documentSnapshots = await getDocs(firstBatch);

            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);

            if (documentSnapshots.empty || documentSnapshots.docs.length < PAGE_SIZE) {
                setHasMore(false);
            }

            const vehiclesData = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            
            const enrichedVehicles = await Promise.all(vehiclesData.map(async (vehicle) => {
                const ownerDocRef = doc(db, "users", vehicle.ownerId);
                const ownerDoc = await getDoc(ownerDocRef);
                const ownerData = ownerDoc.exists() ? ownerDoc.data() as Owner : { name: 'Unknown', phone: 'N/A' };
                return { ...vehicle, owner: ownerData };
            }));

            setAllVehicles(enrichedVehicles);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoreVehicles = async () => {
        if (!lastVisible || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const nextBatch = query(collection(db, 'vehicles'), orderBy('brand'), startAfter(lastVisible), limit(PAGE_SIZE));
            const documentSnapshots = await getDocs(nextBatch);
            
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);
            
            if (documentSnapshots.empty || documentSnapshots.docs.length < PAGE_SIZE) {
                setHasMore(false);
            }

            const vehiclesData = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
             const enrichedVehicles = await Promise.all(vehiclesData.map(async (vehicle) => {
                const ownerDocRef = doc(db, "users", vehicle.ownerId);
                const ownerDoc = await getDoc(ownerDocRef);
                const ownerData = ownerDoc.exists() ? ownerDoc.data() as Owner : { name: 'Unknown', phone: 'N/A' };
                return { ...vehicle, owner: ownerData };
            }));

            setAllVehicles(prev => [...prev, ...enrichedVehicles]);
        } catch (error) {
            console.error("Error fetching more vehicles:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };


    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        // client-side search only on currently loaded vehicles
        const filtered = allVehicles.filter(v => {
            return (
                v.brand.toLowerCase().includes(lowercasedQuery) ||
                v.model.toLowerCase().includes(lowercasedQuery) ||
                v.license.toLowerCase().includes(lowercasedQuery) ||
                v.type.toLowerCase().includes(lowercasedQuery) ||
                v.location.toLowerCase().includes(lowercasedQuery) ||
                v.owner.name.toLowerCase().includes(lowercasedQuery) ||
                v.owner.phone.includes(lowercasedQuery)
            );
        });
        setFilteredVehicles(filtered);
    }, [searchQuery, allVehicles]);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Vehicle Details Report
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="w-full">
                            <CardTitle>All Registered Vehicles</CardTitle>
                            <CardDescription>A comprehensive list of all vehicles on the platform.</CardDescription>
                        </div>
                         <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vehicles or owners..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle Details</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {[...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-4/5" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-2/4" /></TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : filteredVehicles.length > 0 ? (
                                filteredVehicles.map((v) => (
                                    <TableRow key={v.id}>
                                        <TableCell>
                                            <div className="font-bold">{v.brand} {v.model} ({v.year})</div>
                                            <div className="text-xs text-muted-foreground">
                                                <Badge variant="outline" className="mr-2">{v.type}</Badge>
                                                <Badge variant="secondary">{v.license}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{v.owner.name}</div>
                                            <div className="text-xs text-muted-foreground">{v.owner.phone}</div>
                                        </TableCell>
                                        <TableCell>{v.location}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No vehicles found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="justify-center">
                    {hasMore && !searchQuery && (
                        <Button
                            onClick={fetchMoreVehicles}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Load More
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
