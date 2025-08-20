
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useAuthState, useSignOut } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Skeleton } from "../ui/skeleton"

type UserNavProps = {
    isAdmin?: boolean
}

type AppUser = {
  uid: string;
  name: string;
  phone: string;
  email?: string;
}

export function UserNav({ isAdmin = false }: UserNavProps) {
  const [user, loading] = useAuthState(auth);
  const [signOut] = useSignOut(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchUserData = async () => {
      if (isAdmin) {
          const adminUserItem = localStorage.getItem('currentUser');
          if (adminUserItem) {
            const adminUser = JSON.parse(adminUserItem);
            if (adminUser.name === 'Admin') {
                setAppUser({ uid: 'admin-uid', name: 'Admin', phone: 'admin' });
                return;
            }
          }
          setAppUser(null);
      } else if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setAppUser({ uid: user.uid, ...userDoc.data() } as AppUser);
        }
      } else {
        setAppUser(null);
      }
    };

    fetchUserData();
  }, [user, isAdmin, isMounted]);

   useEffect(() => {
    if (isMounted && !loading && !user && !isAdmin) {
      // Check if we are on a dashboard path before redirecting
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
        router.push('/login');
      }
    }
  }, [user, loading, isAdmin, router, isMounted]);


  const getInitials = (name: string | undefined) => {
    if (!name) return isAdmin ? "AD" : "VO";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  const handleLogout = async () => {
    const success = await signOut();
    if (isAdmin) {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('currentUser');
        router.push('/admin/login');
    } else {
        if(success) {
            router.push('/');
        }
    }
  }
  
  if (!isMounted || loading) {
    return (
        <div className="flex items-center space-x-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-3 w-[150px]" />
            </div>
             <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    );
  }
  
  if (!appUser) return null;


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={`https://placehold.co/40x40.png`} alt="@owner" data-ai-hint="person portrait"/>
            <AvatarFallback>{getInitials(appUser?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">{appUser?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {isAdmin ? 'admin@travelgo.com' : (appUser ? `+${appUser.phone}` : 'owner@travelgo.com')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
