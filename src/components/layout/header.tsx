
"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoIcon } from "@/components/icons/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Header() {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    const isLoginPage = pathname === '/login' || pathname === '/admin/login';

    if (isLoginPage) {
        return null;
    }

    const isHomePage = pathname === '/';

    return (
        <header className={cn(
            "px-4 lg:px-6 h-16 flex items-center sticky top-0 z-50 w-full",
            isHomePage ? "bg-secondary/90 md:bg-transparent" : "bg-background/80 backdrop-blur-sm border-b"
        )}>
            <div className="flex items-center">
                <Link className="flex items-center justify-center" href="/">
                    <LogoIcon className={cn("h-6 w-6", isHomePage ? "text-primary" : "text-primary")} />
                    <span className="sr-only">Travel GO</span>
                    <h1 className={cn(
                        "ml-2 text-2xl font-bold font-headline",
                         isHomePage ? "text-primary" : "text-primary"
                    )}>Travel GO</h1>
                </Link>
            </div>
            <NavLinks />
        </header>
    )
}
