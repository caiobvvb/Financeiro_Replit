import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Register() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirm) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/",
        data: { name },
      },
    });
    if (err) {
      setError("Erro ao registrar");
      setLoading(false);
      return;
    }
    setError("Verifique seu e-mail para confirmar o cadastro.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">FinTrack</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta ou crie uma nova</p>
        </div>
        <div className="mb-3 flex justify-center">
          <Tabs defaultValue="register">
            <TabsList>
              <TabsTrigger value="login" onClick={() => setLocation("/")}>Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input type="password" placeholder="Confirme a senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Criando..." : "Criar conta"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setLocation("/")}>Já tenho conta</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
