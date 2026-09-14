"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import type { DepartmentWithCategories } from "@/lib/queries";

export function NavDrawer({
  departments,
}: {
  departments: DepartmentWithCategories[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold text-white transition hover:bg-ink-hover">
        <Menu size={18} />
        All
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[22rem] max-w-[85vw] flex-col bg-surface shadow-2xl focus:outline-none">
          <Dialog.Title className="flex items-center justify-between bg-ink px-5 py-4 text-lg font-semibold text-white">
            Browse Bazaar
            <Dialog.Close
              aria-label="Close menu"
              className="rounded p-1 transition hover:bg-ink-hover"
            >
              <X size={20} />
            </Dialog.Close>
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            All departments and categories
          </Dialog.Description>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {departments.map((dept) => (
              <div key={dept.slug} className="border-b border-border py-2 last:border-0">
                <Link
                  href={`/s?department=${dept.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-1.5 text-sm font-semibold text-fg hover:text-link-hover"
                >
                  {dept.name}
                </Link>
                <ul>
                  {dept.categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/s?category=${cat.slug}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-1.5 text-sm text-fg-muted hover:text-link-hover"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
