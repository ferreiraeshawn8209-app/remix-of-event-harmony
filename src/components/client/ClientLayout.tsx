import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CalendarHeart,
  Music2,
  CreditCard,
  FolderOpen,
  Sparkles,
  Wrench,
  Download,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { PageBackground } from "@/components/PageBackground";

const NAV = [
  { title: "Dashboard", url: "/client", icon: LayoutDashboard },
  { title: "Quotes", url: "/client/event-hub", icon: FileText },
  { title: "Event Details", url: "/client/event-details", icon: CalendarHeart },
  { title: "Music Planner", url: "/client/planner", icon: Music2 },
  { title: "Payments", url: "/client/payments", icon: CreditCard },
  { title: "Documents", url: "/client/documents", icon: FolderOpen },
  { title: "AI Companion", url: "/client/ai", icon: Sparkles },
  { title: "Event Tools", url: "/client/tools", icon: Wrench },
  { title: "Downloads", url: "/client/downloads", icon: Download },
];

function ClientSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();
  const isActive = (url: string) => (url === "/client" ? pathname === url : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/20 bg-background/90 backdrop-blur">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-primary/70">Portal</p>
            <p className="font-bold text-gradient-neon">BeatKulture</p>
            {profile?.full_name && (
              <p className="text-xs text-muted-foreground truncate">{profile.full_name}</p>
            )}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Client area</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="justify-start w-full text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!collapsed && "Sign out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
}

export default function ClientLayout({ title, subtitle, children, showBack }: Props) {
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <PageBackground page="client_portal" />
        <ClientSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-primary/20 bg-background/70 backdrop-blur px-3 sticky top-0 z-30">
            <SidebarTrigger />
            {showBack && (
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg truncate text-gradient-neon">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
