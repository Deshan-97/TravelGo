
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from '@/components/icons/logo';
import Link from 'next/link';

export default function AdminLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoggingIn(true);
        // For simplicity, admin login is checked against hardcoded credentials
        // In a real app, you'd have a separate admin role system in your database.
        if (email === 'Tvlgoadmin' && password === '25kjghtd') {
            localStorage.setItem('isAdmin', 'true');
            // We use a dummy object for the admin user in localStorage
            localStorage.setItem('currentUser', JSON.stringify({ name: 'Admin', phone: 'admin' }));
            toast({
                title: "Admin Login Successful!",
                description: "Redirecting you to the admin dashboard.",
            });
            router.push('/admin/dashboard');
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid credentials. Please try again.",
            });
        }
        setIsLoggingIn(false);
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-muted/40 relative">
             <Button asChild variant="outline" className="absolute top-4 right-4">
                <Link href="/">Back to Home</Link>
            </Button>
            <Card className="mx-auto max-w-sm">
                <CardHeader className="text-center">
                     <LogoIcon className="h-12 w-12 text-primary mx-auto" />
                    <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
                    <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="Username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoggingIn}>
                            {isLoggingIn && <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>}
                            Login
                        </Button>
                    </form>
                     <div className="mt-4 text-center text-sm">
                        <Button variant="link" asChild>
                            <Link href="/login">Switch to Owner Login</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
