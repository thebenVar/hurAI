import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TicketDashboard } from "@/components/TicketDashboard";
import { getTicket } from "@/app/actions/tickets";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TicketDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const ticketData = await getTicket(id);

    if (!ticketData) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-800/50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <TicketDashboard data={ticketData} />
            </div>
        </div>
    );
}
