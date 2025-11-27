import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, Filter, Calendar, MoreVertical } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";

const evolutionData = [
  { name: 'Jan', income: 4000, expense: 2400 },
  { name: 'Fev', income: 3000, expense: 1398 },
  { name: 'Mar', income: 5000, expense: 3800 },
  { name: 'Abr', income: 4780, expense: 2908 },
  { name: 'Mai', income: 5890, expense: 4800 },
  { name: 'Jun', income: 7390, expense: 5800 },
  { name: 'Jul', income: 7850, expense: 4120 },
];

const categoryData = [
  { name: "Alimentação", value: 1854.22, color: "#3b82f6" },
  { name: "Transporte", value: 1030.12, color: "#10b981" },
  { name: "Moradia", value: 618.07, color: "#f97316" },
  { name: "Lazer", value: 412.05, color: "#eab308" },
  { name: "Outros", value: 206.04, color: "#a855f7" },
];

export default function Reports() {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Sua visão financeira completa e detalhada.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant="outline" className="rounded-full bg-white dark:bg-slate-900">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            Este Mês
        </Button>
        <Button variant="outline" className="rounded-full bg-white dark:bg-slate-900">
            Todas as Categorias
        </Button>
        <Button variant="outline" className="rounded-full bg-white dark:bg-slate-900">
            Todas as Contas
        </Button>
        <Button variant="ghost" className="text-primary">
            Aplicar Filtros
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm border-b-4 border-blue-500">
            <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Receitas</p>
                <h2 className="text-3xl font-bold text-blue-600">R$ 7.850,00</h2>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm border-b-4 border-emerald-500">
            <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Despesas</p>
                <h2 className="text-3xl font-bold text-emerald-600">R$ 4.120,50</h2>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm border-b-4 border-red-500 bg-red-50/30 dark:bg-red-950/10">
            <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Balanço Final</p>
                <h2 className="text-3xl font-bold text-red-600">R$ 3.729.50</h2>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Evolução Financeira</CardTitle>
                <div className="flex bg-muted p-1 rounded-lg">
                    <div className="px-3 py-1 rounded-md bg-white dark:bg-slate-800 text-xs font-bold shadow-sm text-primary">Receitas</div>
                    <div className="px-3 py-1 rounded-md text-xs font-medium text-muted-foreground">Despesas</div>
                </div>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Despesas por Categoria</CardTitle>
                <MoreVertical className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {categoryData.map((cat) => (
                        <div key={cat.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{cat.name}</span>
                                <span className="font-bold">R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full" 
                                    style={{ width: `${(cat.value / 4120.50) * 100}%`, backgroundColor: cat.color }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
