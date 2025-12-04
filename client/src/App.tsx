import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import AccountDetails from "@/pages/AccountDetails";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";
import Settings from "@/pages/Settings";
import StatementsPage from "@/pages/Statements";
import CalendarPage from "@/pages/Calendar";
import BankAccounts from "@/pages/BankAccounts";
import TagsPage from "@/pages/Tags";
import InvoiceOverview from "@/pages/InvoiceOverview";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/transactions" component={() => <ProtectedRoute component={Transactions} />} />
      <Route path="/accounts" component={() => <ProtectedRoute component={Accounts} />} />
      <Route path="/contas/:id" component={() => <ProtectedRoute component={AccountDetails} />} />
      <Route path="/contas" component={() => <ProtectedRoute component={BankAccounts} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/categories" component={() => <ProtectedRoute component={Categories} />} />
      <Route path="/tags" component={() => <ProtectedRoute component={TagsPage} />} />
      <Route path="/faturas/:cardId" component={() => <ProtectedRoute component={StatementsPage} />} />
      <Route path="/faturas/:cardId/overview" component={() => <ProtectedRoute component={InvoiceOverview} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={CalendarPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const [, setLocation] = useLocation();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setOk(true);
      else setLocation("/");
    });
  }, [setLocation]);

  if (ok === null) return null;

  return <Component />;
}
