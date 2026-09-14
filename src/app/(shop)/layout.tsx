import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="top" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
