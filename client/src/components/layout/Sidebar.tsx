import { Link, useLocation } from "wouter";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  CreditCard,
  PieChart,
  Settings,
  LogOut,
  List,
  Tags,
  Tag as TagIcon,
  Calendar,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Circle
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const sidebarItems = [
  { icon: LayoutGrid, label: "Painel", href: "/dashboard", color: "text-violet-500", bgColor: "bg-violet-500/10" },
  { icon: List, label: "Transações", href: "/transactions", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { icon: Calendar, label: "Calendário", href: "/calendar", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { icon: CreditCard, label: "Cartões", href: "/accounts", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { icon: Wallet, label: "Contas Bancárias", href: "/contas", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  { icon: PieChart, label: "Relatórios", href: "/reports", color: "text-pink-500", bgColor: "bg-pink-500/10" },
  {
    icon: Settings,
    label: "Configurações",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    subItems: [
      { icon: Settings, label: "Geral", href: "/settings" },
      { icon: Tags, label: "Categorias", href: "/categories" },
      { icon: TagIcon, label: "Tags", href: "/tags" },
    ]
  },
];

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const [profile, setProfile] = React.useState<{ name: string; email: string } | null>(null);
  const [, setLoc] = useLocation();
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({ "Configurações": true }); // Default open for visibility

  React.useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user;
        if (u) {
          const meta: any = u.user_metadata || {};
          setProfile({ name: meta.name || u.email || "Usuário", email: u.email || "" });
        }
      });
    });
  }, []);

  async function onLogout() {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    setLoc("/");
  }

  const toggleSubmenu = (label: string) => {
    if (isCollapsed) return;
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card/95 backdrop-blur-xl border-r border-border/60 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-9 w-6 h-6 bg-card border border-border/60 rounded-full flex items-center justify-center shadow-sm text-muted-foreground hover:text-foreground transition-all hover:scale-110 z-50 focus:outline-none"
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Header */}
      <div className={cn("flex items-center gap-4 transition-all duration-300", isCollapsed ? "p-4 justify-center" : "p-8")}>
        <div className={cn(
          "rounded-xl flex items-center justify-center transform transition-all duration-300",
          isCollapsed ? "w-10 h-10 bg-primary/10" : "w-10 h-10 bg-gradient-to-tr from-primary to-blue-500 shadow-lg shadow-primary/20 hover:scale-105"
        )}>
          <LayoutGrid className={cn("transition-colors", isCollapsed ? "w-6 h-6 text-primary" : "w-6 h-6 text-white")} />
        </div>
        {!isCollapsed && (
          <h1 className="font-display font-bold text-2xl text-foreground tracking-tight whitespace-nowrap overflow-hidden animate-in fade-in duration-300">FinTrack</h1>
        )}
      </div>

      {/* Menu Content */}
      <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-6">
        <div className="space-y-1.5">
          {!isCollapsed && <p className="px-4 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2 animate-in fade-in duration-300">Menu Principal</p>}

          {sidebarItems.map((item) => {
            const hasSubitems = item.subItems && item.subItems.length > 0;
            const isOpen = openSubmenus[item.label];
            // Check if any subitem is active to highlight parent
            const isSubActive = hasSubitems && item.subItems?.some(sub => location === sub.href);
            const isActive = location === item.href || isSubActive; // simple active check

            // Wrapper for click: toggle submenu OR navigate
            const Wrapper = ({ children }: { children: React.ReactNode }) => {
              if (hasSubitems && !isCollapsed) {
                return <div onClick={() => toggleSubmenu(item.label)}>{children}</div>;
              }
              if (hasSubitems && isCollapsed) {
                // If collapsed, clicking parent icon could ideally show popover or expand sidebar. 
                // For now, let's just make it toggle sidebar to allow interaction?? 
                // Or simply navigate to first subitem? 
                // Let's make it expand sidebar if clicked in collapsed mode
                return <div onClick={toggleCollapse}>{children}</div>
              }
              return <Link href={item.href || "#"}>{children}</Link>;
            };

            return (
              <div key={item.label} className="space-y-1">
                <Wrapper>
                  <div
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group cursor-pointer text-sm relative overflow-hidden select-none",
                      isCollapsed ? "justify-center px-0 py-3 rounded-xl mx-auto w-12" : "",
                      (isActive && !hasSubitems) || (hasSubitems && isOpen)
                        ? "bg-secondary/40 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-300",
                      (isActive || isOpen) ? item.bgColor : "bg-transparent group-hover:bg-secondary/50"
                    )}>
                      <item.icon
                        className={cn(
                          "w-5 h-5 transition-all duration-300",
                          (isActive || isOpen) ? item.color : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                    </div>

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {hasSubitems && (
                          <ChevronDown className={cn("w-4 h-4 text-muted-foreground/70 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
                        )}
                        {isActive && !hasSubitems && (
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary/80 shadow-sm" />
                        )}
                      </>
                    )}
                  </div>
                </Wrapper>

                {/* Subitems Rendering */}
                {!isCollapsed && hasSubitems && isOpen && (
                  <div className="pl-4 ml-3 border-l-2 border-border/40 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems?.map(sub => {
                      const isSubLinkActive = location === sub.href;
                      return (
                        <Link key={sub.href} href={sub.href}>
                          <div className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-sm",
                            isSubLinkActive
                              ? "text-primary font-medium bg-primary/5 translate-x-1"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:translate-x-1"
                          )}>
                            {sub.icon ? <sub.icon className="w-4 h-4 opacity-70" /> : <Circle className="w-2 h-2" />}
                            <span>{sub.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Profile */}
      <div className={cn("border-t border-border/40 bg-secondary/10 backdrop-blur-sm transition-all duration-300", isCollapsed ? "p-3" : "p-4")}>
        {!isCollapsed ? (
          <div className="bg-secondary/40 rounded-3xl p-3 border border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name || profile?.email || "user")}`} alt="User" className="w-full h-full" />
              </div>
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-bold text-foreground truncate block">{profile?.name || "Usuário"}</span>
                <span className="text-xs text-muted-foreground truncate block">{profile?.email || ""}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-background hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 border border-border/50 text-xs font-semibold shadow-sm hover:shadow active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0" title={profile?.name}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name || profile?.email || "user")}`} alt="User" className="w-full h-full" />
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
