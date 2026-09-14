"use client";

import Form from "next/form";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { DepartmentWithCategories } from "@/lib/queries";

export function SearchBar({
  departments,
}: {
  departments: DepartmentWithCategories[];
}) {
  const params = useSearchParams();
  const currentDept = params.get("department") ?? "";
  const currentQuery = params.get("k") ?? "";

  return (
    <Form
      action="/s"
      className="flex h-10 w-full overflow-hidden rounded-md bg-surface ring-2 ring-transparent focus-within:ring-accent"
    >
      <label className="sr-only" htmlFor="search-department">
        Search in department
      </label>
      <select
        id="search-department"
        name="department"
        defaultValue={currentDept}
        className="hidden shrink-0 cursor-pointer border-r border-border bg-canvas px-2 text-xs text-fg-muted outline-none sm:block"
      >
        <option value="">All</option>
        {departments.map((d) => (
          <option key={d.slug} value={d.slug}>
            {d.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="search-input">
        Search Bazaar
      </label>
      <input
        id="search-input"
        name="k"
        type="search"
        autoComplete="off"
        defaultValue={currentQuery}
        placeholder="Search Bazaar"
        className="min-w-0 flex-1 px-3 text-sm text-fg outline-none placeholder:text-fg-subtle"
      />

      <button
        type="submit"
        aria-label="Search"
        className="grid w-12 shrink-0 place-items-center bg-accent text-ink transition hover:bg-accent-hover"
      >
        <Search size={18} strokeWidth={2.5} />
      </button>
    </Form>
  );
}
