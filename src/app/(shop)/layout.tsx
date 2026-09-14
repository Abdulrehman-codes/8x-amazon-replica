import { SiteHeader } from "@/components/site-header";
import { StarSprite } from "@/components/ui/stars";
import { ToastProvider } from "@/components/toast";
import { SiteFooter } from "@/components/site-footer";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <StarSprite />
      <SiteHeader />
      <main id="top" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </ToastProvider>
  );
}
