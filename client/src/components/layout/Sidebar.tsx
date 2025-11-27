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
  Calendar,
  Wallet
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutGrid, label: "Painel", href: "/dashboard" },
  { icon: List, label: "Transações", href: "/transactions" },
  { icon: Calendar, label: "Calendário", href: "/calendar" },
  { icon: CreditCard, label: "Cartões", href: "/accounts" },
  { icon: Wallet, label: "Contas Bancárias", href: "/contas" },
  { icon: PieChart, label: "Relatórios", href: "/reports" },
  { icon: Tags, label: "Categorias", href: "/categories" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [profile, setProfile] = React.useState<{ name: string; email: string } | null>(null);
  const [, setLoc] = useLocation();

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

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-30 shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-xl text-foreground tracking-tight">FinTrack</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer font-medium text-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer font-medium text-sm">
          <LogOut className="w-5 h-5" />
          Sair
        </button>
        
        <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name || profile?.email || "user")}`} alt="User" className="w-full h-full" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{profile?.name || "Usuário"}</span>
                <span className="text-xs text-muted-foreground">{profile?.email || ""}</span>
            </div>
        </div>
      </div>
    </aside>
  );
}
