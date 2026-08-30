import { getHomepageTopicLabels } from "@/lib/data/homepage-topics";
import opdDirectory from "@/lib/data/opd-directory.json";

type OpdDirectoryEntry = {
  name?: string;
};

export function getDatasetTopicOptions(): string[] {
  return getHomepageTopicLabels();
}

export function getDatasetOrganizationOptions(): string[] {
  return [...new Set(
    (opdDirectory as OpdDirectoryEntry[])
      .map((item) => item.name?.trim())
      .filter((name): name is string => Boolean(name)),
  )].sort((a, b) => a.localeCompare(b, "id-ID"));
}

export function getDatasetYearOptions(startYear = 2020): string[] {
  const currentYear = new Date().getFullYear();
  const safeStartYear = Math.min(startYear, currentYear);
  const years: string[] = [];

  for (let year = currentYear; year >= safeStartYear; year -= 1) {
    years.push(`${year}`);
  }

  return years;
}
