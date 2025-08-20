
"use client"
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

type User = {
    id: string;
    phone: string;
    name: string;
    status: 'active' | 'paused';
}

type EditUserDialogProps = {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateUser: (userId: string, name: string, password?: string) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUpdateUser }: EditUserDialogProps) {
    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onUpdateUser(user.id, name, password);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Edit User</DialogTitle>
                    <DialogDescription>
                        Update the user's details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-auto max-h-[60vh] pr-6">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">Phone</Label>
                                <Input id="phone" value={user.phone} className="col-span-3" disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">New Password</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" placeholder="Leave blank to keep unchanged" />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4">
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
