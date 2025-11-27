import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  MoreVertical, 
  Trash2, 
  Edit2 
} from "lucide-react";
import { cn } from "@/lib/utils";

const transactions = [
  { id: 1, name: "Salário - Empresa X", category: "Salário", date: "05 Nov, 2023", amount: 5000.00, type: "income", icon: <ArrowUpCircle className="w-6 h-6 text-emerald-500" /> },
  { id: 2, name: "Aluguel do Apartamento", category: "Moradia", date: "05 Nov, 2023", amount: -1500.00, type: "expense", icon: <ArrowDownCircle className="w-6 h-6 text-red-500" /> },
  { id: 3, name: "Supermercado da Semana", category: "Alimentação", date: "03 Nov, 2023", amount: -450.30, type: "expense", icon: <ArrowDownCircle className="w-6 h-6 text-red-500" /> },
  { id: 4, name: "Venda de Item Usado", category: "Renda Extra", date: "01 Nov, 2023", amount: 120.00, type: "income", icon: <ArrowUpCircle className="w-6 h-6 text-emerald-500" /> },
  { id: 5, name: "Conta de Internet", category: "Contas", date: "20 Nov, 2023", amount: -99.90, type: "expense", icon: <ArrowDownCircle className="w-6 h-6 text-red-500" /> },
];

export default function Transactions() {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Todas as Transações</h1>
          <p className="text-muted-foreground">Veja, filtre e gerencie todas as suas entradas e saídas.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-border/50">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Buscar por descrição..." className="pl-10 bg-muted/30 border-transparent focus:bg-white transition-all duration-200" />
            </div>
            <Button variant="outline" className="gap-2 border-border/50">
                <Filter className="w-4 h-4" />
                Filtros
            </Button>
        </div>
        <CardContent className="p-0">
            <div className="w-full overflow-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-full bg-opacity-10", tx.type === 'income' ? "bg-emerald-500" : "bg-red-500")}>
                                            {tx.icon}
                                        </div>
                                        <span className="font-semibold text-foreground">{tx.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {tx.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {tx.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className={cn("font-bold font-mono", tx.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                                        {tx.type === 'income' ? "+" : ""} R$ {Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
