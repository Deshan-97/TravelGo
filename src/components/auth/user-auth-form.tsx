
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Loader } from "@/components/ui/loader";

// Helper function to create a dummy email from a phone number
const createEmailFromPhone = (phone: string) => `${phone}@travelgo.com`;

export function UserAuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone-login") as string;
    const password = formData.get("password-login") as string;
    const email = createEmailFromPhone(phone);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check user status in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data()?.status === 'paused') {
            await auth.signOut();
            toast({
                variant: "destructive",
                title: "Account Paused",
                description: "Your account is currently paused. Please contact support.",
            });
            return;
        }

        toast({
            title: "Login Successful!",
            description: "Redirecting you to the dashboard.",
        });
        router.push('/dashboard');
        
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Invalid credentials or user does not exist.",
        });
    } finally {
        setIsLoggingIn(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSigningUp(true);
      const formData = new FormData(e.currentTarget);
      const phone = formData.get("phone-signup") as string;
      const name = formData.get("name-signup") as string;
      const password = formData.get("password-signup") as string;
      const email = createEmailFromPhone(phone);
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Add display name to firebase auth user
        await updateProfile(user, { displayName: name });

        // Store additional user info in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            phone: phone,
            status: 'active',
            createdAt: new Date()
        });

        toast({
            title: "Sign Up Successful!",
            description: "You can now log in with your mobile number.",
        });

        setActiveTab("login");

      } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.code === 'auth/email-already-in-use' ? 'This mobile number is already registered.' : error.message,
        });
      } finally {
          setIsSigningUp(false);
      }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Login</CardTitle>
            <CardDescription>
              Welcome back! Please login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone-login">Mobile Number</Label>
                  <Input id="phone-login" name="phone-login" type="tel" placeholder="e.g. 0712345678" required pattern="[0-9]{10}" title="Please enter a 10-digit mobile number" disabled={isLoggingIn} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password-login">Password</Label>
                  <Input id="password-login" name="password-login" type="password" required disabled={isLoggingIn} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn && <Loader />}
                  Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Create an account to start managing your vehicles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
                <div className="grid gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="name-signup">Full Name</Label>
                    <Input id="name-signup" name="name-signup" type="text" placeholder="e.g., John Doe" required disabled={isSigningUp} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone-signup">Mobile Number</Label>
                    <Input id="phone-signup" name="phone-signup" type="tel" placeholder="e.g. 0712345678" required pattern="[0-9]{10}" title="Please enter a 10-digit mobile number" disabled={isSigningUp} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" name="password-signup" type="password" required disabled={isSigningUp}/>
                </div>
                <Button type="submit" className="w-full" disabled={isSigningUp}>
                    {isSigningUp && <Loader />}
                    Create Account
                </Button>
                </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
