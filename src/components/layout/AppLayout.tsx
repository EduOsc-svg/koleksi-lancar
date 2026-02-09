import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full max-w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col print:block min-w-0">
          <header className="h-14 border-b flex items-center px-4 gap-4 bg-background print:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold hidden md:block">Sistem Manajemen Kredit</h1>
            <div className="flex-1 max-w-md ml-auto">
              <GlobalSearch />
            </div>
          </header>
          <div className="flex-1 p-6 overflow-x-hidden overflow-y-auto print:p-0 print:m-0 print:overflow-visible min-w-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
