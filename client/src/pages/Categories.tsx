import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Home, Car, Utensils, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Categories() {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Categorias</h1>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Button className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none">Despesas</Button>
        <Button variant="ghost" className="rounded-full text-muted-foreground">Receitas</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Categories List */}
        <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-md bg-[#fcfcfc]">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Categorias Principais</CardTitle>
                        <Button variant="ghost" size="sm" className="text-primary text-xs">+ Adicionar</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { name: "Moradia", count: "2 subcategorias", color: "bg-blue-100 text-blue-600", icon: Home },
                        { name: "Transporte", count: "2 subcategorias", color: "bg-emerald-100 text-emerald-600", icon: Car },
                        { name: "Alimentação", count: "3 subcategorias", color: "bg-orange-100 text-orange-600", icon: Utensils, active: true },
                        { name: "Lazer", count: "2 subcategorias", color: "bg-purple-100 text-purple-600", icon: PartyPopper },
                    ].map((cat) => (
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
                             <Home className="w-4 h-4" /> Moradia
                        </div>
                        <div className="pl-4 space-y-2">
                             <div className="flex items-center p-3 bg-white rounded-lg border border-border/50">
                                <GripVertical className="w-4 h-4 text-muted-foreground/30 mr-3" />
                                <span className="text-sm font-medium">Aluguel</span>
                             </div>
                             <div className="flex items-center p-3 bg-white rounded-lg border border-border/50">
                                <GripVertical className="w-4 h-4 text-muted-foreground/30 mr-3" />
                                <span className="text-sm font-medium">Manutenção</span>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Help/Info Panel */}
        <Card className="border-none shadow-none bg-yellow-50/50 h-fit">
            <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-white rounded-full shadow-sm mb-6 flex items-center justify-center opacity-80 relative overflow-hidden">
                     {/* Abstract Visual */}
                     <div className="absolute w-16 h-16 bg-blue-200 rounded-lg transform rotate-12 -translate-x-4 translate-y-2"></div>
                     <div className="absolute w-16 h-16 bg-purple-200 rounded-lg transform -rotate-6 translate-x-4 -translate-y-2"></div>
                </div>
                <h3 className="font-bold text-lg mb-2">Arraste e solte para organizar</h3>
                <p className="text-sm text-muted-foreground mb-6">Use as alças para reordenar suas categorias e subcategorias.</p>
                
                <div className="w-full border-t border-border/10 my-2"></div>

                <h3 className="font-bold text-lg mb-2 mt-4">Arraste e solte para organizar</h3>
                <p className="text-sm text-muted-foreground">Use as alças para reordenar suas categorias e subcategorias.</p>
            </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
