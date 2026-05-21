import { getOrganizations } from "@/lib/services/ckan-portal-api";
import { loadInternalPortalStore } from "@/lib/services/internal-store";

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function collectComparableTokens(values: Array<string | undefined>): Set<string> {
  return new Set(
    values
      .map((value) => (value ?? "").trim())
      .filter(Boolean)
      .map(normalizeToken)
      .filter(Boolean),
  );
}

export async function resolveCkanOwnerOrgId(rawOrganizationId: string): Promise<string> {
  const input = rawOrganizationId.trim();
  if (!input) {
    throw new Error("OPD/Sumber wajib dipilih.");
  }

  const ckanOrganizations = await getOrganizations();
  const directMatch = ckanOrganizations.find(
    (organization) =>
      organization.id === input ||
      organization.slug === input ||
      organization.name === input,
  );
  if (directMatch) {
    return directMatch.id;
  }

  const candidateTokens = collectComparableTokens([input]);
  try {
    const store = await loadInternalPortalStore();
    const localOrganization = store.organizations.find(
      (organization) =>
        organization.id === input ||
        organization.slug === input ||
        organization.name === input ||
        organization.shortName === input,
    );
    if (localOrganization) {
      collectComparableTokens([
        localOrganization.id,
        localOrganization.slug,
        localOrganization.name,
        localOrganization.shortName,
      ]).forEach((token) => candidateTokens.add(token));
    }
  } catch {
    // Ignore local-store lookup failures and continue with CKAN-only matching.
  }

  const fuzzyMatch = ckanOrganizations.find((organization) => {
    const organizationTokens = collectComparableTokens([
      organization.id,
      organization.slug,
      organization.name,
    ]);
    for (const organizationToken of organizationTokens) {
      for (const candidateToken of candidateTokens) {
        if (
          candidateToken === organizationToken ||
          candidateToken.includes(organizationToken) ||
          organizationToken.includes(candidateToken)
        ) {
          return true;
        }
      }
    }
    return false;
  });

  if (!fuzzyMatch) {
    throw new Error("Organisasi tujuan tidak terdaftar di CKAN. Hubungi Walidata untuk sinkronisasi organisasi.");
  }

  return fuzzyMatch.id;
}
