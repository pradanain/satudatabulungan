import opdDirectory from "@/lib/data/opd-directory.json";

type DirectoryEntry = {
  name?: string;
};

const officialOrganizationNames = [...new Set(
  (opdDirectory as DirectoryEntry[])
    .map((entry) => entry.name?.trim())
    .filter((name): name is string => Boolean(name)),
)];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const officialByNormalized = new Map(
  officialOrganizationNames.map((name) => [normalizeKey(name), name]),
);

const aliasToOfficial = new Map<string, string>([
  ["disdukcapil", "Dinas Kependudukan dan Pencatatan Sipil"],
  ["dinas kependudukan", "Dinas Kependudukan dan Pencatatan Sipil"],
  ["dinkes", "Dinas Kesehatan"],
  ["dlh", "Dinas Lingkungan Hidup"],
  ["dinas pendidikan", "Dinas Pendidikan dan Kebudayaan"],
  ["dinas pupr", "Dinas Perumahan Rakyat dan kawasan permukiman"],
  ["pupr", "Dinas Perumahan Rakyat dan kawasan permukiman"],
  ["dinas koperasi & ukm", "Dinas Perindustrian, Perdagangan, Koperasi dan UMKM"],
  ["dinas koperasi ukm", "Dinas Perindustrian, Perdagangan, Koperasi dan UMKM"],
  ["dinas koperasi", "Dinas Perindustrian, Perdagangan, Koperasi dan UMKM"],
  [
    "dinas koperasi ukm perindustrian dan perdagangan",
    "Dinas Perindustrian, Perdagangan, Koperasi dan UMKM",
  ],
]);

export function normalizeOrganizationName(value: string): string {
  const raw = value.trim();
  if (!raw) {
    return value;
  }

  const normalized = normalizeKey(raw);
  const exactOfficial = officialByNormalized.get(normalized);
  if (exactOfficial) {
    return exactOfficial;
  }

  const aliasOfficial = aliasToOfficial.get(normalized);
  if (aliasOfficial) {
    return aliasOfficial;
  }

  const partialOfficial = officialOrganizationNames.find((official) => {
    const officialNormalized = normalizeKey(official);
    return officialNormalized.includes(normalized) || normalized.includes(officialNormalized);
  });

  return partialOfficial ?? raw;
}
