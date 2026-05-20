import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirect old publications URL to berita as default
export default function InternalPublicationsPage() {
  redirect("/internal/berita");
}
