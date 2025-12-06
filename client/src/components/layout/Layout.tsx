import * as React from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background font-sans flex">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <main
        className={cn(
          "flex-1 p-8 overflow-y-auto h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "ml-20" : "ml-72"
        )}
      >
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
