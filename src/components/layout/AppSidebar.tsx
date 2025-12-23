import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  MapPin,
  UserCircle,
  FileText,
  Wallet,
  BarChart3,
  History,
  LogOut,
  Shield,
  Calendar,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const mainItems = [
  { titleKey: "nav.dashboard", url: "/", icon: LayoutDashboard },
];

const masterItems = [
  { titleKey: "nav.salesAgents", url: "/sales-agents", icon: Users },
  { titleKey: "nav.routes", url: "/routes", icon: MapPin },
  { titleKey: "nav.customers", url: "/customers", icon: UserCircle },
  { titleKey: "nav.contracts", url: "/contracts", icon: FileText },
  { titleKey: "nav.holidays", url: "/holidays", icon: Calendar },
];

const operationItems = [
  { titleKey: "nav.collection", url: "/collection", icon: Wallet },
  { titleKey: "nav.reports", url: "/reports", icon: BarChart3 },
  { titleKey: "nav.customerHistory", url: "/history", icon: History },
];

const systemItems = [
  { titleKey: "nav.auditLog", url: "/audit-log", icon: Shield },
];

export function AppSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r print:hidden">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.main")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.masterData")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {masterItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.operations")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.system")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-3">
          <LanguageSwitcher />
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.logout")}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
