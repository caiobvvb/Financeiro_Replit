import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, CreditCard } from "lucide-react";

export default function Accounts() {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts and credit cards.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Add New
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
                    <h2 className="text-3xl font-bold text-primary">R$ 7.850,00</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary">
                    <Wallet className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Credit Used</p>
                    <h2 className="text-3xl font-bold text-red-600">R$ 2.340,00</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600">
                    <CreditCard className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bank Accounts */}
        <div>
            <h3 className="text-xl font-bold mb-4">Bank Accounts</h3>
            <div className="space-y-4">
                <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
                            Nu
                        </div>
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
                        <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                            It
                        </div>
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
        </div>

        {/* Credit Cards */}
        <div>
            <h3 className="text-xl font-bold mb-4">Credit Cards</h3>
            <div className="space-y-4">
                <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-slate-100 dark:bg-slate-900/50">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-bold text-foreground">Cartão Platinum</h4>
                                <div className="w-8 h-5 bg-slate-400 rounded mt-2 opacity-50"></div>
                            </div>
                            <div className="px-2 py-1 bg-black text-white text-xs font-bold rounded">VISA</div>
                        </div>
                        
                        <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Used Limit</p>
                            <p className="text-2xl font-bold text-foreground">R$ 1.540,00</p>
                        </div>
                        
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-blue-500 w-[38%]"></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Limit: R$ 4.000,00</span>
                            <span>Due: 15/mês</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-slate-100 dark:bg-slate-900/50">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-bold text-foreground">Cartão Black</h4>
                                <div className="w-8 h-5 bg-slate-400 rounded mt-2 opacity-50"></div>
                            </div>
                            <div className="px-2 py-1 bg-emerald-700 text-white text-xs font-bold rounded">MC</div>
                        </div>
                        
                        <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Used Limit</p>
                            <p className="text-2xl font-bold text-foreground">R$ 800,00</p>
                        </div>
                        
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-emerald-500 w-[8%]"></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Limit: R$ 10.000,00</span>
                            <span>Due: 20/mês</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </Layout>
  );
}
