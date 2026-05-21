import { requireAuth } from "@/lib/requireAuth";
import { Sidebar } from "@/components/Sidebar";
import { KBHeader } from "@/components/KBHeader";

export default async function KBLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <KBHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto bg-white flex flex-col min-h-[calc(100vh-3.5rem)]">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-100 px-8 py-4 flex items-center justify-between text-xs text-slate-400">
            <span>FoodXchange Knowledge Base</span>
            <div className="flex items-center gap-4">
              <a
                href="https://fdx.trading"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-600 transition"
              >
                fdx.trading
              </a>
              <a
                href="mailto:info@foodz-x.com"
                className="hover:text-slate-600 transition"
              >
                info@foodz-x.com
              </a>
              <span className="text-slate-300">© 2026 FOODZXCHANGE</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
