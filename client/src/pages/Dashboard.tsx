import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { IconByName } from "@/components/ui/icon-by-name";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { cn } from "@/lib/utils";

const mockData = [
  { name: "Sem 1", income: 4000, expense: 2400 },
  { name: "Sem 2", income: 3000, expense: 1398 },
  { name: "Sem 3", income: 2000, expense: 9800 },
  { name: "Sem 4", income: 2780, expense: 3908 },
];

const categoryData = [
  { name: "Alimentação", value: 4350, color: "#3b82f6" }, // blue-500
  { name: "Transporte", value: 2100, color: "#8b5cf6" }, // violet-500
  { name: "Moradia", value: 1500, color: "#10b981" }, // emerald-500
  { name: "Lazer", value: 900, color: "#f97316" }, // orange-500
];

const recentTransactions = [
  { id: 1, name: "Starbucks Coffee", category: "Alimentação", date: "28 Out", amount: -25.50, icon: "Coffee" },
  { id: 2, name: "Uber Viagem", category: "Transporte", date: "27 Out", amount: -18.90, icon: "Car" },
  { id: 3, name: "Depósito de Salário", category: "Receita", date: "25 Out", amount: 4250.00, icon: "MoneyBag" },
  { id: 4, name: "Pagamento do Aluguel", category: "Moradia", date: "25 Out", amount: -1500.00, icon: "Home" },
];

export default function Dashboard() {
  return (
    <Layout>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel</h1>
          <p className="text-muted-foreground">Bem-vindo de volta, Ana!</p>
        </div>
        <div className="flex gap-2">
          {/* Date Picker Mock */}
          <button className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors">
            Outubro, 2023
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-md bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconByName name="Wallet" className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Balanço Total</p>
                <h2 className="text-3xl font-bold text-foreground">R$ 15.230,50</h2>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400">
                <IconByName name="Wallet" className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-emerald-600 bg-emerald-100/50 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span className="font-medium">+2.5%</span>
              <span className="text-muted-foreground ml-1">vs mês passado</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconByName name="TrendingUp" className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Receitas</p>
                <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">R$ 8.500,00</h2>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-emerald-600 bg-emerald-100/50 w-fit px-2 py-1 rounded-md">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span className="font-medium">+5.6%</span>
              <span className="text-muted-foreground ml-1">vs mês passado</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-red-50/50 dark:bg-red-950/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconByName name="TrendingDown" className="w-24 h-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Despesas</p>
                <h2 className="text-3xl font-bold text-red-700 dark:text-red-400">R$ 4.350,75</h2>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-sm text-red-600 bg-red-100/50 w-fit px-2 py-1 rounded-md">
              <ArrowDownRight className="w-4 h-4 mr-1" />
              <span className="font-medium">-1.2%</span>
              <span className="text-muted-foreground ml-1">vs mês passado</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">Balanço Mensal</CardTitle>
              <p className="text-sm text-muted-foreground">Receitas vs Despesas</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Receitas
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div> Despesas
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} barGap={8}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="url(#colorIncome)" radius={[4, 4, 4, 4]} barSize={32} />
                <Bar dataKey="expense" fill="url(#colorExpense)" radius={[4, 4, 4, 4]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-xs text-muted-foreground">Total Gasto</p>
              <p className="text-xl font-bold text-foreground">R$4.350</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  {cat.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Transações Recentes</CardTitle>
            <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Ver Todas</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-xl transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200">
                      <IconByName name={transaction.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">{transaction.category} • {transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-bold font-mono block", transaction.amount > 0 ? "text-emerald-600" : "text-red-600")}>
                      {transaction.amount > 0 ? "+" : ""} R$ {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Orçamentos do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: "Alimentação", current: 450, total: 800, color: "bg-purple-500" },
              { name: "Transporte", current: 280, total: 400, color: "bg-blue-500" },
              { name: "Lazer", current: 350, total: 300, color: "bg-orange-500" },
              { name: "Compras", current: 150, total: 500, color: "bg-emerald-500" },
            ].map((budget) => (
              <div key={budget.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{budget.name}</span>
                  <span className="text-muted-foreground">R${budget.current} / R${budget.total}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", budget.color, budget.current > budget.total && "bg-red-500")}
                    style={{ width: `${Math.min((budget.current / budget.total) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
