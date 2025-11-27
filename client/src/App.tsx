import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/reports" component={Reports} />
      <Route path="/categories" component={Categories} />
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
