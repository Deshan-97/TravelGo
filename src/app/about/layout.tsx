import { Header } from "@/components/layout/header";

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark">
            <Header />
            {children}
        </div>
    )
}
