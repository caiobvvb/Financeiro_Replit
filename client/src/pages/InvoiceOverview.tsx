import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useRoute, useLocation } from "wouter";
import { formatBRL } from "@/lib/billing";

type CreditCard = { id: string; name: string };
type StatementData = { month: number; year: number; total: number; paid: number; status: string };
type CategoryData = { name: string; value: number; color: string };

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const FULL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#ef4444", "#ec4899", "#eab308", "#06b6d4", "#6366f1", "#d946ef"];

export default function InvoiceOverview() {
    const [, params] = useRoute("/faturas/:cardId/overview");
    const cardId = params?.cardId || "";
    const [, setLocation] = useLocation();
    const [card, setCard] = React.useState<CreditCard | null>(null);
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [month, setMonth] = React.useState<number | null>(null); // null = Annual
    const [historyData, setHistoryData] = React.useState<StatementData[]>([]);
    const [categoryData, setCategoryData] = React.useState<CategoryData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [viewMode, setViewMode] = React.useState<"bar" | "line">("bar");

    React.useEffect(() => {
        if (cardId) fetchData();
    }, [cardId, year, month]);

    async function fetchData() {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Fetch Card Details
        const { data: cardData } = await supabase.from("credit_cards").select("id,name").eq("id", cardId).single();
        if (cardData) setCard(cardData);

        // Fetch Statements History for the Year (Always fetch full year for the top chart)
        const { data: statements } = await supabase
            .from("statements")
            .select("month, year, total_amount, paid_amount, status")
            .eq("credit_card_id", cardId)
            .eq("year", year)
            .order("month");

        const hist = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const st = statements?.find(s => s.month === m);
            return {
                month: m,
                year,
                name: MONTHS[i],
                total: st ? Number(st.total_amount) : 0,
                paid: st ? Number(st.paid_amount) : 0,
                status: st?.status || "open"
            };
        });
        setHistoryData(hist as any);

        // Fetch Transactions for Category Breakdown
        let query = supabase
            .from("transactions")
            .select(`
        amount,
        categories (name, color)
      `)
            .eq("credit_card_id", cardId)
            .eq("statement_year", year)
            .eq("ignored", false);

        if (month !== null) {
            query = query.eq("statement_month", month);
        }

        const { data: transactions } = await query;

        const catMap: Record<string, { value: number, color: string }> = {};
        (transactions || []).forEach((t: any) => {
            const catName = t.categories?.name || "Outros";
            const catColor = t.categories?.color || "#94a3b8";
            const val = Number(t.amount);
            if (!catMap[catName]) catMap[catName] = { value: 0, color: catColor };
            catMap[catName].value += val;
        });

        const catList = Object.entries(catMap)
            .map(([name, { value, color }]) => ({ name, value, color }))
            .sort((a, b) => b.value - a.value);

        setCategoryData(catList);
        setLoading(false);
    }

    const totalYear = historyData.reduce((acc, curr) => acc + curr.total, 0);
    const totalPaid = historyData.reduce((acc, curr) => acc + curr.paid, 0);

    // Calculate total for the pie chart context (Year or Month)
    const totalCategory = categoryData.reduce((acc, curr) => acc + curr.value, 0);

    function handlePrev() {
        if (month === null) {
            setYear(y => y - 1);
        } else {
            if (month === 1) {
                setMonth(12);
                setYear(y => y - 1);
            } else {
                setMonth(m => (m as number) - 1);
            }
        }
    }

    function handleNext() {
        if (month === null) {
            setYear(y => y + 1);
        } else {
            if (month === 12) {
                setMonth(1);
                setYear(y => y + 1);
            } else {
                setMonth(m => (m as number) + 1);
            }
        }
    }

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/faturas/${cardId}`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral: {card?.name}</h1>
                            <p className="text-muted-foreground">Análise de gastos e histórico de faturas.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-1 rounded-lg border shadow-sm">
                        <Button
                            variant={month === null ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setMonth(null)}
                            className="text-xs"
                        >
                            Anual
                        </Button>
                        <Button
                            variant={month !== null ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setMonth(new Date().getMonth() + 1)}
                            className="text-xs"
                        >
                            Mensal
                        </Button>
                    </div>
                </div>

                {/* Navigation & Summary */}
                <div className="flex flex-col items-center justify-center py-4 gap-4">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrev}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[120px] text-center">
                            {month ? `${FULL_MONTHS[month - 1]} ${year}` : `${year}`}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNext}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-md bg-slate-50 dark:bg-slate-900/20">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Faturado ({year})</p>
                            <h2 className="text-3xl font-bold text-foreground">{formatBRL(totalYear)}</h2>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-emerald-50 dark:bg-emerald-900/20">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Pago ({year})</p>
                            <h2 className="text-3xl font-bold text-emerald-600">{formatBRL(totalPaid)}</h2>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Média Mensal</p>
                            <h2 className="text-3xl font-bold text-blue-600">{formatBRL(totalYear / 12)}</h2>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1: Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">
                                Gastos por Categoria ({month ? `${FULL_MONTHS[month - 1]} ${year}` : year})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [formatBRL(value), "Valor"]}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    Sem dados para este período
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Detalhamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {categoryData.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                                            <span className="font-medium text-sm">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold">{formatBRL(cat.value)}</span>
                                            <span className="text-xs text-muted-foreground w-12 text-right">
                                                {totalCategory > 0 ? ((cat.value / totalCategory) * 100).toFixed(1) : "0.0"}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {categoryData.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        Nenhuma categoria encontrada
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2: History */}
                <Card className="border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold">Histórico de Faturas ({year})</CardTitle>
                        <div className="flex bg-muted rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("bar")}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === "bar" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                            >
                                <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("line")}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === "line" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                            >
                                <LineChartIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {viewMode === "bar" ? (
                                <BarChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(v) => `R$${v}`} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [formatBRL(value), "Valor"]}
                                    />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                                        {historyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={month === entry.month ? "#10b981" : "#3b82f6"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <AreaChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(v) => `R$${v}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [formatBRL(value), "Valor"]}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
