import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Globe, Moon, Tags as TagsIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (u) {
        setEmail(u.email || "");
        const meta: any = u.user_metadata || {};
        setName(meta.name || "");
      }
    });
  }, []);

  useEffect(() => {
    supabase.from("tags").select("id,name").order("name").then(({ data }) => {
      setTags((data || []).map((t: any) => ({ id: t.id, name: t.name })));
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    setInfo(null);
    const { error } = await supabase.auth.updateUser({ data: { name } });
    setSaving(false);
    if (error) {
      setInfo("Não foi possível salvar");
      return;
    }
    setInfo("Alterações salvas");
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações da conta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Section */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Perfil
                    </CardTitle>
                    <CardDescription>Suas informações pessoais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={email} type="email" disabled />
                    </div>
                    {info && <p className="text-sm text-muted-foreground">{info}</p>}
                    <Button className="w-fit" onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
                </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        Preferências
                    </CardTitle>
                    <CardDescription>Moeda, idioma e tema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Moeda</Label>
                            <p className="text-sm text-muted-foreground">A moeda principal para seus relatórios.</p>
                        </div>
                        <Select defaultValue="brl">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brl">Real (BRL)</SelectItem>
                                <SelectItem value="usd">Dólar (USD)</SelectItem>
                                <SelectItem value="eur">Euro (EUR)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Idioma</Label>
                            <p className="text-sm text-muted-foreground">O idioma da interface.</p>
                        </div>
                        <Select defaultValue="pt-br" disabled>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-br">Português (BR)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2"><Moon className="w-4 h-4" /> Modo Escuro</Label>
                            <p className="text-sm text-muted-foreground">Alterar para tema escuro.</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>

        {/* Notifications Section */}
        <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Notificações
                    </CardTitle>
                    <CardDescription>Escolha como você quer ser notificado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Alertas de Orçamento</Label>
                            <p className="text-sm text-muted-foreground">Receba avisos quando exceder o orçamento.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Fatura do Cartão</Label>
                            <p className="text-sm text-muted-foreground">Lembretes de vencimento da fatura.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Dicas Financeiras</Label>
                            <p className="text-sm text-muted-foreground">Dicas semanais de economia.</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
        </Card>

        {/* Tags Section */}
        <div id="tags">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TagsIcon className="w-5 h-5 text-primary" />
                Tags
              </CardTitle>
              <CardDescription>Gerencie suas tags para organizar transações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nova tag</Label>
                <div className="col-span-3 flex gap-2">
                  <Input className="flex-1" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                  <Button onClick={async () => {
                    const v = newTag.trim();
                    if (!v) return;
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData.user) return;
                    const { data, error } = await supabase.from("tags").insert({ user_id: userData.user.id, name: v }).select();
                    if (!error && data && data[0]) {
                      setTags((prev) => [...prev, { id: data[0].id, name: data[0].name }]);
                      setNewTag("");
                    }
                  }}>Adicionar</Button>
                </div>
              </div>
              <div className="space-y-2">
                {tags.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-md border">
                    {editingTagId === t.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input className="flex-1" value={editingTagName} onChange={(e) => setEditingTagName(e.target.value)} />
                        <Button variant="outline" onClick={() => { setEditingTagId(null); setEditingTagName(""); }}>Cancelar</Button>
                        <Button onClick={async () => {
                          const name = editingTagName.trim();
                          if (!name) return;
                          const { error } = await supabase.from("tags").update({ name }).eq("id", t.id);
                          if (!error) {
                            setTags((prev) => prev.map((x) => (x.id === t.id ? { ...x, name } : x)));
                            setEditingTagId(null);
                            setEditingTagName("");
                          }
                        }}>Salvar</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="text-muted-foreground" onClick={() => { setEditingTagId(t.id); setEditingTagName(t.name); }}>Editar</Button>
                      <Button variant="ghost" className="text-destructive" onClick={async () => {
                        const { error } = await supabase.from("tags").delete().eq("id", t.id);
                        if (!error) setTags((prev) => prev.filter((x) => x.id !== t.id));
                      }}>Excluir</Button>
                    </div>
                  </div>
                ))}
                {tags.length === 0 ? <div className="text-sm text-muted-foreground">Nenhuma tag cadastrada</div> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Account Status/Plan */}
        <div>
             <Card className="border-none shadow-md bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="text-xl">Plano Premium</CardTitle>
                    <CardDescription className="text-blue-100">Sua assinatura está ativa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm opacity-90">
                        <p>Próxima renovação: 15 Dez, 2023</p>
                        <p>Valor: R$ 29,90/mês</p>
                    </div>
                    <Button variant="secondary" className="w-full font-bold text-primary">Gerenciar Assinatura</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}
