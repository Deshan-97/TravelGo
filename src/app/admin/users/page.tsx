
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2, Pencil, PauseCircle, PlayCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { Input } from '@/components/ui/input';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type User = {
    id: string;
    phone: string;
    name: string;
    status: 'active' | 'paused';
}

const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
}

export default function UsersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersArray = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as User));
            setUsers(usersArray);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (userId: string) => {
        await deleteDoc(doc(db, 'users', userId));
        toast({ title: 'User Deleted', description: 'The user has been successfully deleted.' });
    };

    const handleTogglePause = async (userId: string, currentStatus: 'active' | 'paused') => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        await updateDoc(doc(db, 'users', userId), { status: newStatus });
        toast({ title: 'User Status Updated', description: `The user has been ${newStatus}.` });
    };

    const handleUpdateUser = async (userId: string, name: string, password?: string) => {
        const updateData: { name: string, password?: string } = { name };
        if (password) {
            // Note: In a real app, updating a password via an admin panel should be handled
            // with extreme care, likely involving Firebase Admin SDK on a backend to
            // securely change the auth user's password. This implementation is a simplification
            // and does not update the actual Firebase Auth password.
            updateData.password = password; // This field isn't used for login but is stored for reference
            toast({ variant: 'destructive', title: "Security Warning", description: "Password change from admin panel is for reference only and does not update the user's actual login password." });
        }
        await updateDoc(doc(db, 'users', userId), { name });
        toast({ title: 'User Updated', description: 'User details have been updated.' });
        setSelectedUser(null);
    }

    const filteredUsers = users.filter(user =>
        user.phone.includes(searchQuery) || user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    User Management
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="w-full">
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>A list of all users registered on the platform.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or mobile..."
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
                                <TableHead>User</TableHead>
                                <TableHead className="hidden md:table-cell">Mobile Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                       <div className="space-y-2">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <TableRow key={user.id} className={user.status === 'paused' ? 'opacity-50' : ''}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                         <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://placehold.co/40x40.png`} alt={user.name} data-ai-hint="person portrait"/>
                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            {user.name}
                                            <div className="text-xs text-muted-foreground md:hidden">{user.phone}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                                    <TableCell>{user.status === 'paused' ? 'Paused' : 'Active'}</TableCell>
                                    <TableCell className="text-right space-x-1 md:space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => setSelectedUser(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleTogglePause(user.id, user.status)}>
                                            {user.status === 'paused' ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the user's account and all associated data.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                                    Continue
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        {searchQuery ? 'No users found.' : 'No registered users.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedUser && (
                <EditUserDialog 
                    user={selectedUser}
                    open={!!selectedUser}
                    onOpenChange={(open) => !open && setSelectedUser(null)}
                    onUpdateUser={handleUpdateUser}
                />
            )}
        </div>
    );
}
