import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Globe, Moon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
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
                        <Input id="name" defaultValue="Ana Oliveira" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue="ana@email.com" type="email" />
                    </div>
                    <Button className="w-fit">Salvar Alterações</Button>
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
