"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * Filter access below the `lg` breakpoint, where the sidebar is hidden.
 *
 * The sidebar itself is a server component and is passed through as children,
 * so the facet counts still render on the server — this only supplies the
 * sheet around them.
 */
export function MobileFilters({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();

  // Every filter is a link, so choosing one navigates. Close the sheet when
  // the query changes, otherwise it sits open over the new results.
  const key = params.toString();
  useEffect(() => {
    setOpen(false);
  }, [key]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium transition hover:bg-canvas lg:hidden">
        <SlidersHorizontal size={15} />
        Filters
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-ink">
            {activeCount}
          </span>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[20rem] max-w-[85vw] flex-col bg-surface shadow-2xl focus:outline-none lg:hidden">
          <Dialog.Title className="flex items-center justify-between border-b border-border px-4 py-3 text-base font-semibold">
            Filters
            <Dialog.Close
              aria-label="Close filters"
              className="rounded p-1 transition hover:bg-canvas"
            >
              <X size={18} />
            </Dialog.Close>
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Narrow these results by delivery, category, price, rating and brand
          </Dialog.Description>

          <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

          <div className="border-t border-border p-3">
            <Dialog.Close className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover">
              Show results
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
