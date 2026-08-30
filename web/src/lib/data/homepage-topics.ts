import type { TopicCarouselIconKey } from "@/components/portal/topic-carousel";
import type { Dataset } from "@/lib/types/dataset";

export interface HomepageTopicDefinition {
  label: string;
  iconKey: TopicCarouselIconKey;
  accentColor: string;
  exactTopics?: string[];
  keywords: string[];
  filterTopic?: string;
  searchTerm?: string;
}

export const homepageTopics: HomepageTopicDefinition[] = [
  {
    label: "Ekonomi",
    iconKey: "ekonomi",
    accentColor: "#c86e1a",
    exactTopics: ["Ekonomi"],
    keywords: ["ekonomi", "umkm", "koperasi", "pangan", "hortikultura"],
    filterTopic: "Ekonomi",
  },
  {
    label: "Kependudukan",
    iconKey: "kependudukan",
    accentColor: "#2f66d2",
    exactTopics: ["Kependudukan"],
    keywords: ["kependudukan", "penduduk", "demografi", "disdukcapil"],
    filterTopic: "Kependudukan",
  },
  {
    label: "Kesehatan",
    iconKey: "kesehatan",
    accentColor: "#14984e",
    exactTopics: ["Kesehatan"],
    keywords: ["kesehatan", "puskesmas", "fasilitas kesehatan", "tenaga medis"],
    filterTopic: "Kesehatan",
  },
  {
    label: "Pendidikan",
    iconKey: "pendidikan",
    accentColor: "#b71f1f",
    exactTopics: ["Pendidikan"],
    keywords: ["pendidikan", "sekolah", "peserta didik", "guru"],
    filterTopic: "Pendidikan",
  },
  {
    label: "Infrastruktur",
    iconKey: "infrastruktur",
    accentColor: "#1f5fcb",
    exactTopics: ["Infrastruktur"],
    keywords: ["infrastruktur", "jalan", "jembatan", "transportasi"],
    filterTopic: "Infrastruktur",
  },
  {
    label: "Pemerintahan",
    iconKey: "pemerintahan",
    accentColor: "#856404",
    keywords: ["pemerintahan", "opd", "perangkat daerah", "pelayanan publik"],
    searchTerm: "pemerintahan",
  },
  {
    label: "Sosial",
    iconKey: "sosial",
    accentColor: "#b84b6d",
    keywords: ["sosial", "bansos", "perlindungan sosial", "kesejahteraan"],
    searchTerm: "sosial",
  },
  {
    label: "Lingkungan Hidup",
    iconKey: "lingkungan",
    accentColor: "#0f8b52",
    exactTopics: ["Lingkungan"],
    keywords: ["lingkungan", "iklh", "sdgs", "tutupan lahan", "air"],
    filterTopic: "Lingkungan",
  },
  {
    label: "Ketenagakerjaan",
    iconKey: "ketenagakerjaan",
    accentColor: "#875d3b",
    keywords: ["ketenagakerjaan", "tenaga kerja", "pengangguran", "pekerja"],
    searchTerm: "ketenagakerjaan",
  },
  {
    label: "Pertanian",
    iconKey: "pertanian",
    accentColor: "#4f8b2c",
    keywords: ["pertanian", "pangan", "hortikultura", "komoditas"],
    searchTerm: "pertanian",
  },
  {
    label: "Kelautan dan Perikanan",
    iconKey: "perikanan",
    accentColor: "#1677a8",
    keywords: ["kelautan", "perikanan", "ikan", "budidaya"],
    searchTerm: "perikanan",
  },
  {
    label: "Perhubungan dan Transportasi",
    iconKey: "transportasi",
    accentColor: "#4b5fa7",
    keywords: ["perhubungan", "transportasi", "jalan", "jembatan", "angkutan"],
    searchTerm: "transportasi",
  },
  {
    label: "Pariwisata dan Kebudayaan",
    iconKey: "pariwisata",
    accentColor: "#b26c20",
    keywords: ["pariwisata", "kebudayaan", "wisata", "budaya"],
    searchTerm: "pariwisata",
  },
  {
    label: "Kebencanaan",
    iconKey: "kebencanaan",
    accentColor: "#c2491f",
    keywords: ["kebencanaan", "bencana", "banjir", "longsor", "darurat"],
    searchTerm: "kebencanaan",
  },
  {
    label: "Komunikasi dan Informatika",
    iconKey: "kominfo",
    accentColor: "#2b6bb0",
    keywords: ["komunikasi", "informatika", "kominfo", "telekomunikasi", "digital"],
    searchTerm: "kominfo",
  },
  {
    label: "Kepemudaan dan Olahraga",
    iconKey: "olahraga",
    accentColor: "#7f4fb0",
    keywords: ["kepemudaan", "olahraga", "pemuda", "atlet"],
    searchTerm: "olahraga",
  },
];

function getTopicSearchableContent(dataset: Dataset): string {
  return [
    dataset.topic,
    dataset.title,
    dataset.summary,
    dataset.organization,
    ...dataset.metadata.tags,
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesHomepageTopic(dataset: Dataset, definition: HomepageTopicDefinition): boolean {
  if (
    definition.exactTopics?.some(
      (topic) => dataset.topic.toLowerCase() === topic.toLowerCase(),
    )
  ) {
    return true;
  }

  const searchableContent = getTopicSearchableContent(dataset);
  return definition.keywords.some((keyword) =>
    searchableContent.includes(keyword.toLowerCase()),
  );
}

export function matchesHomepageTopicFilter(dataset: Dataset, topicFilter: string): boolean {
  const normalizedFilter = topicFilter.trim().toLowerCase();

  if (!normalizedFilter) {
    return true;
  }

  if (dataset.topic.trim().toLowerCase() === normalizedFilter) {
    return true;
  }

  const definition = homepageTopics.find(
    (item) => item.label.toLowerCase() === normalizedFilter,
  );

  if (!definition) {
    return false;
  }

  return matchesHomepageTopic(dataset, definition);
}

export function getHomepageTopicLabels(): string[] {
  return homepageTopics.map((item) => item.label);
}
