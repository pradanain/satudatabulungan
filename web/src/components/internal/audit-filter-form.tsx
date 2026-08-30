"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditFilterFormProps {
  slug: string;
  actorOptions: string[];
  statusOptions: string[];
  actorFilter: string;
  statusFilter: string;
  dateFromFilter: string;
  dateToFilter: string;
  exportJsonHref: string;
  exportCsvHref: string;
}

export function AuditFilterForm({
  slug,
  actorOptions,
  statusOptions,
  actorFilter,
  statusFilter,
  dateFromFilter,
  dateToFilter,
  exportJsonHref,
  exportCsvHref,
}: AuditFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    formData.forEach((value, key) => {
      if (value && value !== "none") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    router.push(`/internal/workflow/${slug}/audit?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="internal-field-label gap-1.5">
        Actor
        <Select name="actor" defaultValue={actorFilter || ""}>
          <SelectTrigger className="h-11 border-(--color-border)">
            <SelectValue placeholder="Semua actor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Semua actor</SelectItem>
            {actorOptions.map((actor) => (
              <SelectItem key={actor} value={actor}>
                {actor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="internal-field-label gap-1.5">
        Status
        <Select name="status" defaultValue={statusFilter || ""}>
          <SelectTrigger className="h-11 border-(--color-border)">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Semua status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="internal-field-label gap-1.5">
        Dari tanggal
        <Input type="date" name="dateFrom" defaultValue={dateFromFilter} />
      </label>

      <label className="internal-field-label gap-1.5">
        Sampai tanggal
        <Input type="date" name="dateTo" defaultValue={dateToFilter} />
      </label>

      <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
        <Button type="submit" className="rounded-xl">
          Terapkan Filter
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="rounded-xl"
          onClick={() => router.push(`/internal/workflow/${slug}/audit`)}
        >
          Reset
        </Button>
        <Button asChild variant="secondary" className="rounded-xl">
          <a href={exportJsonHref}>Export JSON</a>
        </Button>
        <Button asChild variant="secondary" className="rounded-xl">
          <a href={exportCsvHref}>Export CSV</a>
        </Button>
      </div>
    </form>
  );
}
