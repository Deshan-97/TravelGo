
"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Menu, Phone, Facebook, Instagram } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function NavLinks() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    const linkClasses = (mobile = false) => cn(
        "text-sm font-medium transition-colors",
        isHomePage && !mobile ? "text-white/80 hover:text-white" : "hover:text-primary",
        mobile && "text-base"
    );

    const activeLinkClasses = (mobile = false) => cn(
        isHomePage && !mobile ? "text-white font-semibold" : "text-primary font-semibold"
    );
    
    const desktopNav = (
        <div className="hidden md:flex items-center gap-4 sm:gap-6">
            <Link href="/" className={cn(linkClasses(), pathname === "/" && activeLinkClasses())}>Home</Link>
            <Link href="/about" className={cn(linkClasses(), pathname === "/about" && activeLinkClasses())}>About Us</Link>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="link" className={cn("p-0 h-auto", linkClasses())}>Contact Us</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href="tel:0774588143" className="font-semibold">077 458 8143</a>
                    </div>
                </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
                <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
            </div>
             <Button asChild>
                <Link href="/login">Owner Login</Link>
            </Button>
        </div>
    );
    
    const mobileNav = (
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <div className="flex flex-col gap-6 pt-6 p-4">
                        <Link href="/" className={cn(linkClasses(true), pathname === "/" && activeLinkClasses(true))}>Home</Link>
                        <Link href="/about" className={cn(linkClasses(true), pathname === "/about" && activeLinkClasses(true))}>About Us</Link>
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            <a href="tel:0774588143" className={cn(linkClasses(true), "font-semibold")}>077 458 8143</a>
                        </div>
                         <div className="flex items-center gap-4 pt-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-6 w-6" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></Link>
                        </div>
                        <Button asChild className="w-full mt-8">
                            <Link href="/login">Owner Login</Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );

    return (
        <nav className="ml-auto flex items-center gap-4">
            {desktopNav}
            {mobileNav}
        </nav>
    );
}
