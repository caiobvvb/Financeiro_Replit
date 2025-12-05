import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconByName } from "@/components/ui/icon-by-name";
import { cn } from "@/lib/utils";
import { Edit2, Trash2, CheckCircle, Clock, Pin, Repeat, MoreHorizontal, ArrowRightLeft } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    category_id: string;
    account_id: string | null;
    credit_card_id: string | null;
    tags: string[];
    is_fixed: boolean;
    is_recurring: boolean;
    recurrence_frequency: string | null;
    recurrence_count: number | null;
    status: "paid" | "pending";
    category?: { name: string; icon: string; color: string; type: string };
    account?: { name: string; bank_id?: string };
};

type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null; logoUrl?: string | null };

interface TransactionListProps {
    transactions: Transaction[];
    onEdit: (tx: Transaction) => void;
    onDelete: (id: string) => void;
    onConvertToTransfer: (tx: Transaction) => void;
    banks: Bank[];
}

export function TransactionList({ transactions, onEdit, onDelete, onConvertToTransfer, banks }: TransactionListProps) {

    function bankIconByName(name?: string): string | undefined {
        const n = (name || "").toLowerCase();
        if (!n) return undefined;
        if (n.includes("brasil")) return "ibb-banco-brasil";
        if (n.includes("itaú") || n.includes("itau")) return "ibb-itau";
        if (n.includes("bradesco")) return "ibb-bradesco";
        if (n.includes("santander")) return "ibb-santander";
        if (n.includes("caixa")) return "ibb-caixa";
        if (n.includes("nubank") || n.includes("nu ")) return "ibb-nubank";
        if (n.includes("inter")) return "ibb-inter";
        if (n.includes("btg")) return "ibb-btg";
        if (n.includes("c6")) return "ibb-c6";
        if (n.includes("sicredi")) return "ibb-sicredi";
        if (n.includes("sicoob")) return "ibb-sicoob";
        if (n.includes("original")) return "ibb-original";
        if (n.includes("safra")) return "ibb-safra";
        if (n.includes("banrisul")) return "ibb-banrisul";
        return undefined;
    }

    return (
        <div className="w-full overflow-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Conta</th>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                Nenhuma transação encontrada.
                            </td>
                        </tr>
                    )}
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted/20 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border",
                                        tx.amount >= 0
                                            ? "bg-emerald-100 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                            : "bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                    )}>
                                        <IconByName name={tx.category?.icon || "Circle"} className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">{tx.description || "Sem descrição"}</span>
                                        <div className="flex gap-1 mt-1">
                                            {tx.is_fixed && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-1"><Pin className="w-2 h-2" /> Fixa</Badge>}
                                            {tx.is_recurring && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-1"><Repeat className="w-2 h-2" /> Recorrente</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border bg-slate-100 dark:bg-slate-800")}>
                                            <IconByName name={tx.category?.icon || "Circle"} className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-foreground">
                                            {tx.category?.name || "Sem categoria"}
                                        </span>
                                    </div>
                                    {tx.tags && tx.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {tx.tags.map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {tag}
                                        </span>
                                    ))}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const nm = (tx.account?.name || "").toLowerCase();
                                        const bankById = banks.find((b) => b.id === (tx.account?.bank_id || ""));
                                        const bankByName = banks.find((b) => {
                                            const bn = (b.shortName || b.name || "").toLowerCase();
                                            const sl = (b.slug || "").toLowerCase();
                                            return nm && (bn.includes(nm) || nm.includes(bn) || (sl && nm.includes(sl)));
                                        });
                                        const bank = bankById || bankByName;
                                        const iconClass = (bank ? bankIconByName(bank.shortName || bank.name) : bankIconByName(tx.account?.name));
                                        const isBB = (iconClass && iconClass.includes("banco-brasil")) || nm.includes("brasil");
                                        const bg = bank?.color || (isBB ? "#F8D117" : undefined) || "#999";
                                        const finalIconClass = iconClass || (isBB ? "ibb-banco-brasil" : undefined);

                                        return finalIconClass ? (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                                                <span className={`${finalIconClass} text-lg text-white`}></span>
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground font-bold text-xs">
                                                {(tx.account?.name || "Ct").substring(0, 2)}
                                            </div>
                                        );
                                    })()}
                                    <span>{tx.account?.name || "-"}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {tx.status === 'paid' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Pago
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        <Clock className="w-3 h-3 mr-1" /> Pendente
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={cn("font-bold font-mono", tx.amount >= 0 ? "text-emerald-600" : "text-red-600")}>
                                    {tx.amount >= 0 ? "+" : ""} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(tx)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(tx.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onEdit(tx)}>
                                                <Edit2 className="w-4 h-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onConvertToTransfer(tx)}>
                                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Converter em transferência
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(tx.id)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
