import Link from "next/link";
import { Eye, Info, Plus } from "lucide-react";
import { InternalPageHeader } from "@/components/internal/internal-page-header";
import { InternalShell } from "@/components/internal/internal-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientDataTable, ColumnDef } from "@/components/internal/client-data-table";
import { loadInternalPortalStore } from "@/lib/services/internal-store";
import { requireInternalSession } from "@/lib/utils/internal-auth-server";
import { hasPermission } from "@/lib/utils/internal-auth";
import type { InternalTopicReference } from "@/lib/types/internal";
import { TopicsTable } from "./topics-table";

export const dynamic = "force-dynamic";

export default async function InternalTopicsPage() {
  const session = await requireInternalSession("topics");
  const store = await loadInternalPortalStore();

  const canManage = hasPermission(session, "master_data.manage_topics");

  return (
    <InternalShell session={session} activeKey="topics">
      <InternalPageHeader
        title="Topik Dataset"
        description="Kelola topik, kode referensi, dan steward dataset untuk menjaga konsistensi master data."
        badges={<Badge variant="outline">{store.topics.length} topik</Badge>}
      />

      <Card className="flex flex-col shadow-sm border-[var(--color-border)]">
        <TopicsTable
          topics={store.topics}
          organizations={store.organizations}
          actionButton={
            canManage ? (
              <Button size="sm" className="gap-1.5 bg-[var(--color-primary)] hover:bg-[#8f1717] text-white">
                <Plus className="size-4" />
                Tambah Topik
              </Button>
            ) : undefined
          }
        />
      </Card>
    </InternalShell>
  );
}
