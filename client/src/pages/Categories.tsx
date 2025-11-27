import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GripVertical, Home, Car, Utensils, PartyPopper, Wallet, TrendingUp, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Categories() {
  const [activeTab, setActiveTab] = useState("expenses");

  const expenseCategories = [
    { name: "Moradia", count: "2 subcategorias", color: "bg-blue-100 text-blue-600", icon: Home },
    { name: "Transporte", count: "2 subcategorias", color: "bg-emerald-100 text-emerald-600", icon: Car },
    { name: "Alimentação", count: "3 subcategorias", color: "bg-orange-100 text-orange-600", icon: Utensils, active: true },
    { name: "Lazer", count: "2 subcategorias", color: "bg-purple-100 text-purple-600", icon: PartyPopper },
  ];

  const incomeCategories = [
    { name: "Salário", count: "1 subcategoria", color: "bg-emerald-100 text-emerald-600", icon: Wallet },
    { name: "Investimentos", count: "3 subcategorias", color: "bg-blue-100 text-blue-600", icon: TrendingUp },
    { name: "Freelance", count: "0 subcategorias", color: "bg-purple-100 text-purple-600", icon: Briefcase },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Categorias</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma nova categoria para organizar suas {activeTab === 'expenses' ? 'despesas' : 'receitas'}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input id="name" placeholder="Ex: Educação" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  Cor
                </Label>
                <div className="flex gap-2 col-span-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer ring-2 ring-offset-2 ring-blue-500"></div>
                    <div className="w-8 h-8 rounded-full bg-red-500 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-green-500 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-yellow-500 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-purple-500 cursor-pointer"></div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Categoria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 rounded-full">
            <TabsTrigger value="expenses" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Despesas</TabsTrigger>
            <TabsTrigger value="income" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-md bg-[#fcfcfc]">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Categorias de Despesas</CardTitle>
                                <Button variant="ghost" size="sm" className="text-primary text-xs">+ Adicionar</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {expenseCategories.map((cat) => (
                                <div 
                                    key={cat.name} 
                                    className={cn(
                                        "flex items-center p-4 rounded-xl border transition-all cursor-move select-none",
                                        cat.active 
                                            ? "bg-orange-50 border-orange-200 shadow-sm scale-[1.02]" 
                                            : "bg-white border-border/50 hover:border-primary/30 hover:bg-white"
                                    )}
                                >
                                    <GripVertical className="w-5 h-5 text-muted-foreground/40 mr-4" />
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4", cat.color)}>
                                        <cat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{cat.name}</h4>
                                        <p className="text-xs text-muted-foreground">{cat.count}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-[#fcfcfc]">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Subcategorias</CardTitle>
                                <span className="text-xs text-muted-foreground">Arraste para reordenar dentro de cada categoria</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                                    <Utensils className="w-4 h-4" /> Alimentação
                                </div>
                                <div className="pl-4 space-y-2">
                                    <div className="flex items-center p-3 bg-white rounded-lg border border-border/50">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 mr-3" />
                                        <span className="text-sm font-medium">Supermercado</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-white rounded-lg border border-border/50">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 mr-3" />
                                        <span className="text-sm font-medium">Restaurantes</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-white rounded-lg border border-border/50">
                                        <GripVertical className="w-4 h-4 text-muted-foreground/30 mr-3" />
                                        <span className="text-sm font-medium">Lanches</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Info Panel */}
                <Card className="border-none shadow-none bg-yellow-50/50 h-fit">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-white rounded-full shadow-sm mb-6 flex items-center justify-center opacity-80 relative overflow-hidden">
                            <div className="absolute w-16 h-16 bg-blue-200 rounded-lg transform rotate-12 -translate-x-4 translate-y-2"></div>
                            <div className="absolute w-16 h-16 bg-purple-200 rounded-lg transform -rotate-6 translate-x-4 -translate-y-2"></div>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Organize suas Despesas</h3>
                        <p className="text-sm text-muted-foreground mb-6">Categorias bem definidas ajudam a entender para onde vai seu dinheiro.</p>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="income" className="mt-0">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-md bg-[#fcfcfc]">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Categorias de Receitas</CardTitle>
                                <Button variant="ghost" size="sm" className="text-primary text-xs">+ Adicionar</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {incomeCategories.map((cat) => (
                                <div 
                                    key={cat.name} 
                                    className="flex items-center p-4 rounded-xl border bg-white border-border/50 hover:border-primary/30 hover:bg-white transition-all cursor-move select-none"
                                >
                                    <GripVertical className="w-5 h-5 text-muted-foreground/40 mr-4" />
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4", cat.color)}>
                                        <cat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{cat.name}</h4>
                                        <p className="text-xs text-muted-foreground">{cat.count}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                 {/* Info Panel */}
                <Card className="border-none shadow-none bg-emerald-50/50 h-fit">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-white rounded-full shadow-sm mb-6 flex items-center justify-center opacity-80 relative overflow-hidden">
                             <div className="absolute w-16 h-16 bg-emerald-200 rounded-lg transform rotate-45"></div>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Rastreie seus Ganhos</h3>
                        <p className="text-sm text-muted-foreground mb-6">Separe seu salário de rendas extras e investimentos.</p>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
