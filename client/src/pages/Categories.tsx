import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GripVertical, Home, Car, Utensils, Wallet, TrendingUp, Briefcase, Edit2, Archive, ArchiveRestore, Trash2, ChevronDown, ChevronRight, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { supabase } from "@/lib/supabase";

type Category = { id: string; userId: string; name: string; type: string; description?: string | null; icon?: string | null; color?: string | null; archived?: boolean | null };
type Subcategory = { id: string; userId: string; categoryId: string; name: string; description?: string | null; icon?: string | null; color?: string | null; archived?: boolean | null };

const iconMap: Record<string, React.ComponentType<any>> = { Home, Car, Utensils, Wallet, TrendingUp, Briefcase, ShoppingCart, CreditCard, Fuel, Phone, Wifi, FileText, Gift, DollarSign, Coins, PiggyBank, Banknote, Bus, School, Heart, Stethoscope, Dumbbell, Pill, PlayCircle, Tv, Bike, Hammer, Wrench };
function IconByName({ name, className }: { name?: string | null; className?: string }) {
  const key = (name || "").trim();
  const Comp = iconMap[key] || Utensils;
  return <Comp className={className} />;
}

export default function Categories() {
  const [activeTab, setActiveTab] = React.useState("expenses");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconName, setIconName] = React.useState<string>("");
  const [colorPick, setColorPick] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editCat, setEditCat] = React.useState<Category | null>(null);
  const [subsByCat, setSubsByCat] = React.useState<Record<string, Subcategory[]>>({});
  const [addingSubFor, setAddingSubFor] = React.useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = React.useState<Set<string>>(new Set());
  const [subCountByCat, setSubCountByCat] = React.useState<Record<string, number>>({});
  const [subName, setSubName] = React.useState("");
  const [subDescription, setSubDescription] = React.useState("");
  const [subIconName, setSubIconName] = React.useState<string>("");
  const [subColorPick, setSubColorPick] = React.useState<string | null>(null);
  const [editSubId, setEditSubId] = React.useState<string | null>(null);
  const [editSubName, setEditSubName] = React.useState("");
  const [editSubDescription, setEditSubDescription] = React.useState("");
  const [editSubColor, setEditSubColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setCategories([]);
        return;
      }
      const q = supabase
        .from("categories")
        .select("id,user_id,name,type,description,icon,color,archived")
        .eq("type", activeTab === "expenses" ? "expense" : "income")
        .order("name", { ascending: true });
      const { data, error } = showArchived ? await q : await q.eq("archived", false);
      if (error || !data) {
        setCategories([]);
        return;
      }
      setCategories(
        data.map((c: any) => ({ id: c.id, userId: c.user_id, name: c.name, type: c.type, description: c.description, icon: c.icon, color: c.color, archived: c.archived }))
      );
    })();
  }, [activeTab, showArchived]);

  async function createCategory() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setCreating(false);
        return;
      }
      const payload = {
        user_id: userData.user.id,
        name,
        type: activeTab === "expenses" ? "expense" : "income",
        description: description || null,
        icon: iconName || null,
        color: colorPick || null,
      } as any;
      const { data, error } = await supabase.from("categories").insert(payload).select();
      if (error || !data) {
        setCreating(false);
        return;
      }
      setCategories((prev) => [
        ...prev,
        { id: data[0].id, userId: data[0].user_id, name: data[0].name, type: data[0].type, description: data[0].description, icon: data[0].icon, color: data[0].color, archived: data[0].archived },
      ]);
      setName("");
      setDescription("");
      setIconName("");
      setColorPick(null);
      setCreating(false);
      setCreateOpen(false);
    } catch {
      setCreating(false);
    }
  }

  const expenseList = categories.filter((c) => c.type === "expense");
  const incomeList = categories.filter((c) => c.type === "income");

  function openEdit(c: Category) {
    setEditCat(c);
    setEditOpen(true);
  }

  async function updateCategory() {
    if (!editCat) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: editCat.name, description: editCat.description || null, icon: editCat.icon || null, color: editCat.color || null, archived: !!editCat.archived })
      .eq("id", editCat.id);
    if (error) return;
    setEditOpen(false);
    setCategories((prev) => prev.map((c) => (c.id === editCat.id ? editCat : c)));
  }

  async function toggleArchive(c: Category) {
    const next = !c.archived;
    const { error } = await supabase.from("categories").update({ archived: next }).eq("id", c.id);
    if (error) return;
    setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, archived: next } : x)));
  }

  async function canDeleteCategory(id: string): Promise<boolean> {
    const { count: txCount } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("category_id", id);
    const { count: subCount } = await supabase.from("subcategories").select("id", { count: "exact", head: true }).eq("category_id", id);
    return (txCount || 0) === 0 && (subCount || 0) === 0;
  }

  async function deleteCategory(id: string) {
    const ok = await canDeleteCategory(id);
    if (!ok) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function fetchSubcategories(categoryId: string) {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id,user_id,category_id,name,description,icon,color,archived")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });
    if (error) return;
    setSubsByCat((prev) => ({ ...prev, [categoryId]: (data || []).map((s: any) => ({ id: s.id, userId: s.user_id, categoryId: s.category_id, name: s.name, description: s.description, icon: s.icon, color: s.color, archived: s.archived })) }));
    setSubCountByCat((prev) => ({ ...prev, [categoryId]: (data || []).length }));
  }

  async function createSubcategory(categoryId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !subName.trim()) return;
    const { data, error } = await supabase
      .from("subcategories")
      .insert({ user_id: userData.user.id, category_id: categoryId, name: subName, description: subDescription || null, icon: subIconName || null, color: subColorPick || null })
      .select();
    if (error || !data) return;
    setSubsByCat((prev) => ({ ...prev, [categoryId]: [...(prev[categoryId] || []), { id: data[0].id, userId: data[0].user_id, categoryId, name: data[0].name, description: data[0].description, icon: data[0].icon, color: data[0].color, archived: data[0].archived }] }));
    setSubName("");
    setSubDescription("");
    setSubIconName("");
    setSubColorPick(null);
    setAddingSubFor(null);
  }

  async function toggleArchiveSub(s: Subcategory) {
    const next = !s.archived;
    const { error } = await supabase.from("subcategories").update({ archived: next }).eq("id", s.id);
    if (error) return;
    setSubsByCat((prev) => ({ ...prev, [s.categoryId]: (prev[s.categoryId] || []).map((x) => (x.id === s.id ? { ...x, archived: next } : x)) }));
  }

  async function canDeleteSub(id: string): Promise<boolean> {
    const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true }).eq("subcategory_id", id);
    return (count || 0) === 0;
  }

  async function deleteSub(s: Subcategory) {
    const ok = await canDeleteSub(s.id);
    if (!ok) return;
    const { error } = await supabase.from("subcategories").delete().eq("id", s.id);
    if (error) return;
    setSubsByCat((prev) => ({ ...prev, [s.categoryId]: (prev[s.categoryId] || []).filter((x) => x.id !== s.id) }));
  }

  async function updateSubcategory(s: Subcategory) {
    const { error } = await supabase
      .from("subcategories")
      .update({ name: editSubName, description: editSubDescription || null, color: editSubColor || null })
      .eq("id", s.id);
    if (error) return;
    setSubsByCat((prev) => ({
      ...prev,
      [s.categoryId]: (prev[s.categoryId] || []).map((x) => (x.id === s.id ? { ...x, name: editSubName, description: editSubDescription || null, color: editSubColor || null } : x)),
    }));
    setEditSubId(null);
    setEditSubName("");
    setEditSubDescription("");
    setEditSubColor(null);
  }

  function toggleCollapsed(catId: string) {
    const wasCollapsed = collapsedCats.has(catId);
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
    if (wasCollapsed) {
      fetchSubcategories(catId);
    }
  }

  React.useEffect(() => {
    (async () => {
      if (!categories.length) {
        setSubCountByCat({});
        return;
      }
      const next: Record<string, number> = {};
      for (const c of categories) {
        const { count } = await supabase
          .from("subcategories")
          .select("id", { count: "exact", head: true })
          .eq("category_id", c.id);
        next[c.id] = count || 0;
      }
      setSubCountByCat(next);
      for (const c of categories) {
        if ((next[c.id] || 0) > 0 && !(subsByCat[c.id]?.length)) {
          fetchSubcategories(c.id);
        }
      }
    })();
  }, [categories]);

  const expenseIconChoices: { key: string; label: string }[] = [
    { key: "Utensils", label: "Alimentação" },
    { key: "ShoppingCart", label: "Compras" },
    { key: "CreditCard", label: "Cartão" },
    { key: "Home", label: "Moradia" },
    { key: "Car", label: "Carro" },
    { key: "Bus", label: "Transporte" },
    { key: "Bike", label: "Bicicleta" },
    { key: "Fuel", label: "Combustível" },
    { key: "Phone", label: "Telefone" },
    { key: "Wifi", label: "Internet" },
    { key: "FileText", label: "Documentos" },
    { key: "Gift", label: "Presentes" },
    { key: "Stethoscope", label: "Saúde" },
    { key: "School", label: "Educação" },
    { key: "Dumbbell", label: "Academia" },
    { key: "Pill", label: "Farmácia" },
    { key: "ShoppingCart", label: "Supermercado" },
    { key: "Tv", label: "TV/Streaming" },
    { key: "Hammer", label: "Reforma" },
    { key: "Wrench", label: "Ferramentas" },
    { key: "Briefcase", label: "Trabalho" },
  ];
  const incomeIconChoices: { key: string; label: string }[] = [
    { key: "Wallet", label: "Carteira" },
    { key: "TrendingUp", label: "Investimentos" },
    { key: "DollarSign", label: "Salário" },
    { key: "Coins", label: "Juros" },
    { key: "PiggyBank", label: "Poupança" },
    { key: "Banknote", label: "Recebimentos" },
    { key: "Briefcase", label: "Freelance" },
  ];
  const iconChoices = activeTab === "expenses" ? expenseIconChoices : incomeIconChoices;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Categorias</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Mostrar Arquivadas
          </label>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>Crie uma nova categoria para organizar suas {activeTab === "expenses" ? "despesas" : "receitas"}.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Nome</Label>
                  <Input className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Descrição</Label>
                  <Input className="col-span-3" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Ícone</Label>
                  <div className="col-span-3 flex gap-2 flex-wrap">
                    {iconChoices.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-md border", iconName === key ? "border-primary text-primary" : "border-border text-muted-foreground")}
                        onClick={() => setIconName(key)}
                        aria-label={label}
                        title={label}
                      >
                        <IconByName name={key} className="w-4 h-4" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Cor</Label>
                  <div className="flex gap-2 col-span-3">
                    {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
                      <button key={c} type="button" aria-label="Selecionar cor" onClick={() => setColorPick(c)} className={cn("w-8 h-8 rounded-full", colorPick === c ? "ring-2 ring-offset-2 ring-foreground" : "")} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={createCategory} disabled={creating}>{creating ? "Criando..." : "Criar Categoria"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                  {expenseList.map((cat) => (
                    <div key={cat.id} className="p-4 rounded-xl border bg-white border-border/50 hover:border-primary/30 transition-all select-none">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-muted-foreground/40" />
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-2" style={{ backgroundColor: cat.color || "#fde68a" }}>
                          <IconByName name={cat.icon} className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm flex items-center gap-2">{cat.name} {cat.archived ? <span className="text-xs px-2 py-0.5 rounded bg-muted">Arquivada</span> : null} {collapsedCats.has(cat.id) && ((subCountByCat[cat.id] || (subsByCat[cat.id]?.length || 0)) > 0) ? <span className="text-xs px-2 py-0.5 rounded bg-muted">{(subCountByCat[cat.id] || (subsByCat[cat.id]?.length || 0))}</span> : null}</h4>
                          {cat.description ? <p className="text-xs text-muted-foreground">{cat.description}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-primary" onClick={() => openEdit(cat)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Editar
                          </Button>
                          {cat.archived ? (
                            <Button variant="ghost" className="h-8 px-3 text-muted-foreground" onClick={() => toggleArchive(cat)}>
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Desarquivar
                            </Button>
                          ) : (
                            <Button variant="ghost" className="h-8 px-3 text-muted-foreground" onClick={() => toggleArchive(cat)}>
                              <Archive className="w-4 h-4 mr-2" /> Arquivar
                            </Button>
                          )}
                          <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-destructive" onClick={() => deleteCategory(cat.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </Button>
                          {(subCountByCat[cat.id] || (subsByCat[cat.id]?.length || 0)) > 0 ? (
                            <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-primary" onClick={() => toggleCollapsed(cat.id)}>
                              {!collapsedCats.has(cat.id) && (subsByCat[cat.id]?.length || 0) > 0 ? (<><ChevronDown className="w-4 h-4 mr-2" /> Ocultar</>) : (<><ChevronRight className="w-4 h-4 mr-2" /> Mostrar</>)}
                            </Button>
                          ) : null}
                          <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-primary" title="Subcategoria" onClick={() => { setAddingSubFor(cat.id); fetchSubcategories(cat.id); }}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {!collapsedCats.has(cat.id) && (subsByCat[cat.id]?.length || 0) > 0 ? (
                        <div className="mt-4 pl-8 space-y-2">
                          {subsByCat[cat.id].map((s) => (
                            <div key={s.id} className="flex items-center p-3 bg-white rounded-lg border border-border/50 justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: s.color || "#e5e7eb" }}></div>
                                {editSubId === s.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input className="h-8 w-40" value={editSubName} onChange={(e) => setEditSubName(e.target.value)} />
                                    <Input className="h-8 w-56" placeholder="Descrição" value={editSubDescription} onChange={(e) => setEditSubDescription(e.target.value)} />
                                    <div className="flex gap-1">
                                      {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
                                        <button key={c} type="button" className={cn("w-4 h-4 rounded-full", editSubColor === c ? "ring-2 ring-offset-1 ring-foreground" : "")} style={{ backgroundColor: c }} onClick={() => setEditSubColor(c)} />
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium flex items-center gap-2">{s.name} {s.archived ? <span className="text-[10px] px-1 rounded bg-muted">Arq.</span> : null}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => toggleArchiveSub(s)}>{s.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}</Button>
                                {editSubId === s.id ? (
                                  <Button variant="ghost" className="h-7 px-3 text-muted-foreground hover:text-primary" onClick={() => updateSubcategory(s)}>Salvar</Button>
                                ) : (
                                  <Button variant="ghost" className="h-7 px-3 text-muted-foreground" onClick={() => { setEditSubId(s.id); setEditSubName(s.name); setEditSubDescription(s.description || ""); setEditSubColor(s.color || null); }}>Editar</Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSub(s)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {!collapsedCats.has(cat.id) && addingSubFor === cat.id ? (
                        <div className="mt-4 pl-8 space-y-3">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Nome</Label>
                            <Input className="col-span-3" value={subName} onChange={(e) => setSubName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Descrição</Label>
                            <Input className="col-span-3" value={subDescription} onChange={(e) => setSubDescription(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Ícone</Label>
                            <Input className="col-span-3" value={subIconName} onChange={(e) => setSubIconName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Cor</Label>
                            <div className="col-span-3 flex gap-2">
                              {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
                                <button key={c} type="button" className={cn("w-6 h-6 rounded-full", subColorPick === c ? "ring-2 ring-offset-2 ring-foreground" : "")} style={{ backgroundColor: c }} onClick={() => setSubColorPick(c)} />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => createSubcategory(cat.id)}>Adicionar Subcategoria</Button>
                            <Button variant="outline" onClick={() => setAddingSubFor(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {expenseList.length === 0 ? (<div className="text-sm text-muted-foreground">Nenhuma categoria de despesa</div>) : null}
                </CardContent>
              </Card>
            </div>
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
                  {incomeList.map((cat) => (
                    <div key={cat.id} className="p-4 rounded-xl border bg-white border-border/50 hover:border-primary/30 transition-all select-none">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-muted-foreground/40" />
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-2" style={{ backgroundColor: cat.color || "#d1fae5" }}>
                          <IconByName name={cat.icon} className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm flex items-center gap-2">{cat.name} {cat.archived ? <span className="text-xs px-2 py-0.5 rounded bg-muted">Arquivada</span> : null} {collapsedCats.has(cat.id) && ((subCountByCat[cat.id] || (subsByCat[cat.id]?.length || 0)) > 0) ? <span className="text-xs px-2 py-0.5 rounded bg-muted">{(subCountByCat[cat.id] || (subsByCat[cat.id]?.length || 0))}</span> : null}</h4>
                          {cat.description ? <p className="text-xs text-muted-foreground">{cat.description}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-primary" onClick={() => openEdit(cat)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Editar
                          </Button>
                          {cat.archived ? (
                            <Button variant="ghost" className="h-8 px-3 text-muted-foreground" onClick={() => toggleArchive(cat)}>
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Desarquivar
                            </Button>
                          ) : (
                            <Button variant="ghost" className="h-8 px-3 text-muted-foreground" onClick={() => toggleArchive(cat)}>
                              <Archive className="w-4 h-4 mr-2" /> Arquivar
                            </Button>
                          )}
                          <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-destructive" onClick={() => deleteCategory(cat.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </Button>
                          {(subCountByCat[cat.id] || (subsByCat[cat.id]?.length || 0)) > 0 ? (
                            <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-primary" onClick={() => toggleCollapsed(cat.id)}>
                              {!collapsedCats.has(cat.id) && (subsByCat[cat.id]?.length || 0) > 0 ? (<><ChevronDown className="w-4 h-4 mr-2" /> Ocultar</>) : (<><ChevronRight className="w-4 h-4 mr-2" /> Mostrar</>)}
                            </Button>
                          ) : null}
                          <Button variant="ghost" className="h-8 px-3 text-muted-foreground hover:text-primary" title="Subcategoria" onClick={() => { setAddingSubFor(cat.id); fetchSubcategories(cat.id); }}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {!collapsedCats.has(cat.id) && (subsByCat[cat.id]?.length || 0) > 0 ? (
                        <div className="mt-4 pl-8 space-y-2">
                          {subsByCat[cat.id].map((s) => (
                            <div key={s.id} className="flex items-center p-3 bg-white rounded-lg border border-border/50 justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: s.color || "#e5e7eb" }}></div>
                                <span className="text-sm font-medium flex items-center gap-2">{s.name} {s.archived ? <span className="text-[10px] px-1 rounded bg-muted">Arq.</span> : null}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => toggleArchiveSub(s)}>{s.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}</Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSub(s)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {!collapsedCats.has(cat.id) && addingSubFor === cat.id ? (
                        <div className="mt-4 pl-8 space-y-3">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Nome</Label>
                            <Input className="col-span-3" value={subName} onChange={(e) => setSubName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Descrição</Label>
                            <Input className="col-span-3" value={subDescription} onChange={(e) => setSubDescription(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Ícone</Label>
                            <Input className="col-span-3" value={subIconName} onChange={(e) => setSubIconName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Cor</Label>
                            <div className="col-span-3 flex gap-2">
                              {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
                                <button key={c} type="button" className={cn("w-6 h-6 rounded-full", subColorPick === c ? "ring-2 ring-offset-2 ring-foreground" : "")} style={{ backgroundColor: c }} onClick={() => setSubColorPick(c)} />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => createSubcategory(cat.id)}>Adicionar Subcategoria</Button>
                            <Button variant="outline" onClick={() => setAddingSubFor(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {incomeList.length === 0 ? (<div className="text-sm text-muted-foreground">Nenhuma categoria de receita</div>) : null}
                </CardContent>
              </Card>
            </div>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>Altere os dados da categoria.</DialogDescription>
          </DialogHeader>
          {editCat ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nome</Label>
                <Input className="col-span-3" value={editCat.name} onChange={(e) => setEditCat({ ...editCat, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Descrição</Label>
                <Input className="col-span-3" value={editCat.description || ""} onChange={(e) => setEditCat({ ...editCat, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ícone</Label>
                <div className="col-span-3 flex gap-2 flex-wrap">
                  {iconChoices.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-md border", editCat.icon === key ? "border-primary text-primary" : "border-border text-muted-foreground")}
                      onClick={() => setEditCat({ ...editCat, icon: key })}
                      aria-label={label}
                      title={label}
                    >
                      <IconByName name={key} className="w-4 h-4" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Cor</Label>
                <div className="col-span-3 flex gap-2">
                  {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
                    <button key={c} type="button" className={cn("w-6 h-6 rounded-full", editCat.color === c ? "ring-2 ring-offset-2 ring-foreground" : "")} style={{ backgroundColor: c }} onClick={() => setEditCat({ ...editCat, color: c })} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Arquivada</Label>
                <div className="col-span-3">
                  <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!editCat.archived} onChange={(e) => setEditCat({ ...editCat, archived: e.target.checked })} /> Arquivar categoria</label>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" onClick={updateCategory}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
