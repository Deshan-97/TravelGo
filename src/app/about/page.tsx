

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AboutUsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 px-4 md:px-10 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  Connecting You with the Perfect Ride
                </h1>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Travel GO was founded on a simple idea: to make vehicle rentals in our community easier, safer, and more reliable. We connect customers with a network of trusted local vehicle owners, offering a diverse fleet for any occasion.
                </p>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                  Our platform empowers local entrepreneurs by providing them with the tools to manage their vehicles and hires, while giving customers a seamless way to book their perfect ride.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Our Mission</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  To be the most trusted and convenient platform for vehicle hires, fostering a community of reliable owners and satisfied customers. We are committed to safety, quality, and supporting local businesses.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Meet the Team</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  The passionate individuals behind Travel GO.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-2 pt-12">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="Nushara Amarasinghe" data-ai-hint="person portrait" />
                  <AvatarFallback>NA</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-bold">Nushara Amarasinghe</h3>
                  <p className="text-muted-foreground">Co-Founder & CEO</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                 <Avatar className="h-24 w-24">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="Deshan Vimukthi" data-ai-hint="person portrait" />
                  <AvatarFallback>DV</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-lg font-bold">Deshan Vimukthi</h3>
                  <p className="text-muted-foreground">Co-Founder & CTO</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
       <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Travel GO. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="/about" className="text-xs hover:underline underline-offset-4 text-muted-foreground">About Us</Link>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="link" className="text-xs hover:underline underline-offset-4 p-0 h-auto text-muted-foreground">Contact Us</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href="tel:0774588143" className="font-semibold">077 458 8143</a>
                    </div>
                </PopoverContent>
            </Popover>
        </nav>
      </footer>
    </div>
  );
}
