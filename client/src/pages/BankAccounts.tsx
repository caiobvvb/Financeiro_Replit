import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
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
import { Wallet, Plus } from "lucide-react";

export default function BankAccounts() {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contas Bancárias</h1>
          <p className="text-muted-foreground">Gerencie suas contas correntes e poupanças.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Conta Bancária</DialogTitle>
              <DialogDescription>Cadastre uma nova conta bancária.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" placeholder="Ex: Conta Corrente" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bank" className="text-right">Banco</Label>
                <Input id="bank" placeholder="Ex: Nubank, Itaú" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <Input id="type" placeholder="Corrente, Poupança" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">Saldo inicial</Label>
                <Input id="balance" placeholder="R$ 0,00" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Total</p>
              <h2 className="text-3xl font-bold text-primary">R$ 7.850,00</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">Nu</div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">Conta Corrente</h4>
              <p className="text-sm text-muted-foreground">Nubank</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">R$ 5.720,50</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">It</div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">Poupança</h4>
              <p className="text-sm text-muted-foreground">Itaú</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">R$ 2.129,50</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
