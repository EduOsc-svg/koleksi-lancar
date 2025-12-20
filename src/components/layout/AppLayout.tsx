import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col print:block">
          <header className="h-14 border-b flex items-center px-4 bg-background print:hidden">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Credit Installment Management</h1>
          </header>
          <div className="flex-1 p-6 overflow-auto print:p-0 print:m-0 print:overflow-visible">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
