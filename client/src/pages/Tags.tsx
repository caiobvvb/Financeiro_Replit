import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Tag as TagIcon, Trash2, Edit2 } from "lucide-react";
import * as React from "react";
import { supabase } from "@/lib/supabase";

export default function TagsPage() {
  const [tags, setTags] = React.useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tags").select("id,name").order("name");
      setTags((data || []).map((t: any) => ({ id: t.id, name: t.name })));
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  async function addTag() {
    const v = newTag.trim();
    if (!v) return;
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }
    const { data, error } = await supabase.from("tags").insert({ user_id: userData.user.id, name: v }).select();
    setLoading(false);
    if (!error && data && data[0]) {
      setTags((prev) => [...prev, { id: data[0].id, name: data[0].name }]);
      setNewTag("");
    }
  }

  async function saveEdit(id: string) {
    const v = editingName.trim();
    if (!v) return;
    const { error } = await supabase.from("tags").update({ name: v }).eq("id", id);
    if (!error) {
      setTags((prev) => prev.map((x) => (x.id === id ? { ...x, name: v } : x)));
      setEditingId(null);
      setEditingName("");
    }
  }

  async function removeTag(id: string) {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (!error) setTags((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tags</h1>
          <p className="text-muted-foreground">Gerencie e pesquise tags para organizar transações.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TagIcon className="w-5 h-5 text-primary" /> Todas as tags</CardTitle>
          <CardDescription>Crie, edite, exclua e pesquise.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="Nova tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
              <Button onClick={addTag} disabled={loading}>{loading ? "..." : "Adicionar"}</Button>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-md border">
                {editingId === t.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input className="flex-1" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    <Button variant="outline" onClick={() => { setEditingId(null); setEditingName(""); }}>Cancelar</Button>
                    <Button onClick={() => saveEdit(t.id)}>Salvar</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="text-muted-foreground" onClick={() => { setEditingId(t.id); setEditingName(t.name); }}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" className="text-destructive" onClick={() => removeTag(t.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? <div className="text-sm text-muted-foreground">Nenhuma tag encontrada</div> : null}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

