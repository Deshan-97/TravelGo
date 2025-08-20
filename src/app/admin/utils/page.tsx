
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminUtilsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isClearing, setIsClearing] = useState(false);

    const clearCollection = async (collectionName: string) => {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (snapshot.empty) {
            return 0; // No documents to delete
        }

        // Firestore allows a maximum of 500 operations in a single batch.
        const batchSize = 500;
        let documentsDeleted = 0;

        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = snapshot.docs.slice(i, i + batchSize);
            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            documentsDeleted += chunk.length;
        }

        return documentsDeleted;
    };

    const handleClearData = async () => {
        setIsClearing(true);
        try {
            const collectionsToClear = ['hires', 'requests', 'commissions'];
            let totalDeleted = 0;

            for (const collectionName of collectionsToClear) {
                const count = await clearCollection(collectionName);
                totalDeleted += count;
            }
            
            toast({
                title: "Data Cleared Successfully!",
                description: `Removed ${totalDeleted} documents from hires, requests, and commissions collections.`,
            });
        } catch (error) {
            console.error("Error clearing data:", error);
            toast({
                variant: 'destructive',
                title: 'Error Clearing Data',
                description: 'Could not clear all data. Please check the console for errors.',
            });
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Admin Utilities
                </h1>
            </div>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive" />
                        <span>Danger Zone</span>
                    </CardTitle>
                    <CardDescription>
                        These are destructive actions. Please be certain before proceeding.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1 pr-4">
                            <h3 className="font-semibold">Clear Hire Data</h3>
                            <p className="text-sm text-muted-foreground">
                                This will permanently delete all documents from the `hires`, `requests`, and `commissions` collections. This is useful for clearing test data. This action cannot be undone.
                            </p>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="mt-2 md:mt-0" disabled={isClearing}>
                                    {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Clear All Hire Data
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all hire, request, and commission data from the database.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearData}>
                                    Yes, delete all data
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
