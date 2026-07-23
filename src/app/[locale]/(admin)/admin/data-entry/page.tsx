import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import { DataEntryDashboard } from "@/components/admin/DataEntryDashboard";

// Accepta Admin Control — internal program data-entry console. Open to both
// SUPER_ADMIN and DATA_ENTRY admins; deleting entries stays super-only.
// Everyone else gets a 404.

export const dynamic = "force-dynamic";

export default async function DataEntryAdminPage() {
    const admin = await getAdmin();
    if (!admin) notFound();

    return <DataEntryDashboard canDelete={admin.role === "SUPER_ADMIN"} />;
}
