import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirect old /publications/new to /berita/new as default
export default function NewPublicationRedirect() {
  redirect("/internal/berita/new");
}
