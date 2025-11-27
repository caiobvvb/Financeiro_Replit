import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err || !data.session) {
      setError("Credenciais inválidas");
      setLoading(false);
      return;
    }
    setLocation("/dashboard");
  }

  async function onReset() {
    if (!email) {
      setError("Informe o e-mail para recuperar a senha");
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/",
    });
    if (err) {
      setError("Não foi possível enviar o e-mail de recuperação");
      return;
    }
    setError("Verifique seu e-mail para redefinir a senha.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">FinTrack</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta ou crie uma nova</p>
        </div>
        <div className="mb-3 flex justify-center">
          <Tabs defaultValue="login">
            <TabsList>
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register" onClick={() => setLocation("/register")}>Cadastrar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="text-right">
                <button type="button" className="text-xs text-primary hover:underline" onClick={onReset}>Esqueceu a senha?</button>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setLocation("/register")}>Criar conta</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
