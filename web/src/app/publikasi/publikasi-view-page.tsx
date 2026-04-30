import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { getDatasets } from "@/lib/services/dataset-service";
import { loadKabarDataItems } from "@/lib/services/news-service";
import { PublikasiContent, type PublicationCatalogItem, type PublicationView } from "@/app/publikasi/publikasi-content";

interface PublikasiViewPageProps {
  view: PublicationView;
}

export async function PublikasiViewPage({ view }: PublikasiViewPageProps) {
  const [kabarDataItems, datasets] = await Promise.all([loadKabarDataItems(), getDatasets({ sort: "terbaru" })]);

  const digitalBookItems: PublicationCatalogItem[] = datasets
    .filter((dataset) => dataset.formats.includes("PDF") || dataset.resources.some((resource) => resource.format === "PDF"))
    .map((dataset) => ({
      id: dataset.id,
      title: dataset.title,
      summary: dataset.summary,
      organization: dataset.organization,
      lastUpdated: dataset.lastUpdated,
      href: `/dataset/${dataset.slug}`,
    }))
    .slice(0, 24);

  const basePathByView: Record<PublicationView, string> = {
    berita: "/publikasi-berita",
    "buku-digital": "/publikasi-buku-digital",
    infografis: "/publikasi/infografis",
    regulasi: "/publikasi-regulasi",
    "petunjuk-teknis": "/publikasi-petunjuk-teknis",
  };

  return (
    <PortalPageShell activeMenu="publikasi">
      <PublikasiContent
        view={view}
        basePath={basePathByView[view]}
        sort="terbaru"
        itemsPerPage={12}
        currentPage={1}
        totalItems={view === "berita" ? kabarDataItems.length : digitalBookItems.length}
        kabarDataItems={view === "berita" ? kabarDataItems.slice(0, 12) : []}
        publicationItems={view === "berita" ? [] : digitalBookItems.slice(0, 12)}
      />
    </PortalPageShell>
  );
}
