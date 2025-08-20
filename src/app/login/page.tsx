
import { UserAuthForm } from '@/components/auth/user-auth-form';
import { LogoIcon } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-muted/40 relative">
       <Button asChild variant="outline" className="absolute top-4 right-4">
          <Link href="/">Back to Home</Link>
      </Button>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[380px] gap-6 p-4">
          <div className="grid gap-2 text-center">
            <LogoIcon className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-3xl font-bold font-headline">Vehicle Owner Portal</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>
          <UserAuthForm />
           <div className="text-center text-sm text-muted-foreground">
             <Button variant="link" asChild className="mt-4">
                <Link href="/admin/login">Admin Panel</Link>
            </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
