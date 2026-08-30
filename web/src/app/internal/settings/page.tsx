import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function InternalSettingsPage() {
  redirect("/internal/integrations");
}
