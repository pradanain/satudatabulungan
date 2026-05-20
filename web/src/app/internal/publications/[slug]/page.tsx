import { redirect } from "next/navigation";
import { loadInternalPortalStore } from "@/lib/services/internal-store";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicationDetailRedirect({ params }: PageProps) {
  const { slug } = await params;
  const store = await loadInternalPortalStore();
  const pub = (store.publications || []).find((p) => p.slug === slug);

  if (!pub) {
    redirect("/internal/berita");
  }

  switch (pub.type) {
    case "news": redirect(`/internal/berita/${slug}`);
    case "digital_publication": redirect(`/internal/buku-digital/${slug}`);
    case "infographic": redirect(`/internal/infografis-internal/${slug}`);
    default: redirect("/internal/berita");
  }
}
