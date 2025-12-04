import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Landmark, Wallet, Tag as TagIcon, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    category_id: string;
    account_id: string | null;
    tags: string[];
    account?: { name: string; bank_id?: string };
};

type Account = { id: string; name: string; bank_id?: string };
type Bank = { id: string; code: string; name: string; shortName?: string | null; slug?: string | null; color?: string | null; logoUrl?: string | null };

interface TransferConversionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction | null;
    accounts: Account[];
    banks: Bank[];
    onSuccess: () => void;
}

export function TransferConversionDialog({
    open,
    onOpenChange,
    transaction,
    accounts,
    banks,
    onSuccess,
}: TransferConversionDialogProps) {
    const [amount, setAmount] = React.useState("");
    const [date, setDate] = React.useState<Date>(new Date());
    const [targetAccountId, setTargetAccountId] = React.useState("");
    const [observation, setObservation] = React.useState("");
    const [tags, setTags] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (transaction) {
            setAmount(Math.abs(transaction.amount).toFixed(2));
            setDate(new Date(transaction.date));
            setObservation(transaction.description);
            setTags(transaction.tags || []);
            // Reset target account
            setTargetAccountId("");
        }
    }, [transaction]);

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

    async function handleConvert() {
        if (!transaction || !targetAccountId) return;
        setLoading(true);

        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error("User not found");

            // 1. Find or create "Transferência" category
            let categoryId = transaction.category_id;
            const { data: categories } = await supabase
                .from("categories")
                .select("id")
                .ilike("name", "Transferência")
                .single();

            if (categories) {
                categoryId = categories.id;
            } else {
                // Fallback: keep original category or create one (skipping creation for now to simplify)
            }

            const transferAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
            const formattedDate = format(date, "yyyy-MM-dd");

            // 2. Update Original Transaction
            // If original was Expense (Source): It remains Expense.
            // If original was Income (Destination): It remains Income.
            // We just update metadata to reflect it's now a transfer part.

            await supabase
                .from("bank_transactions")
                .update({
                    amount: transaction.type === "expense" ? -Math.abs(transferAmount) : Math.abs(transferAmount),
                    date: formattedDate,
                    description: observation || `Transferência ${transaction.type === "expense" ? "para" : "de"} ${accounts.find(a => a.id === targetAccountId)?.name}`,
                    category_id: categoryId,
                    tags: [...tags, "transferência"],
                })
                .eq("id", transaction.id);

            // 3. Create Counterpart Transaction
            // If original was Expense (Source), counterpart is Income (Destination).
            // If original was Income (Destination), counterpart is Expense (Source).

            const counterpartType = transaction.type === "expense" ? "income" : "expense";
            const counterpartAmount = counterpartType === "income" ? Math.abs(transferAmount) : -Math.abs(transferAmount);

            await supabase.from("bank_transactions").insert({
                user_id: userData.user.id,
                account_id: targetAccountId,
                description: observation || `Transferência ${counterpartType === "income" ? "de" : "para"} ${transaction.account?.name}`,
                amount: counterpartAmount,
                type: counterpartType,
                date: formattedDate,
                category_id: categoryId,
                status: "paid", // Transfers are usually immediate
                tags: [...tags, "transferência"],
            });

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error converting transfer:", error);
            alert("Erro ao converter transferência.");
        } finally {
            setLoading(false);
        }
    }

    const currentAccount = accounts.find(a => a.id === transaction?.account_id);
    const currentBank = banks.find(b => b.id === currentAccount?.bank_id);
    const currentIconClass = currentBank ? bankIconByName(currentBank.shortName || currentBank.name) : bankIconByName(currentAccount?.name);

    // Filter out current account from target options
    const targetOptions = accounts.filter(a => a.id !== transaction?.account_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Converter em transferência</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    {/* Amount */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-10 text-lg font-bold"
                            placeholder="0,00"
                        />
                    </div>

                    {/* Date */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "dd 'de' MMMM yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Source Account (Read-only representation of current transaction account) */}
                    <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                            style={{ backgroundColor: currentBank?.color || "#999" }}
                        >
                            {currentIconClass ? (
                                <span className={`${currentIconClass} text-sm text-white`}></span>
                            ) : (
                                (currentAccount?.name || "??").substring(0, 2)
                            )}
                        </div>
                        <span className="font-medium">{currentAccount?.name}</span>
                    </div>

                    <div className="flex justify-center -my-2 z-10">
                        <div className="bg-background p-1 rounded-full border">
                            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Target Account Select */}
                    <div className="space-y-2">
                        <Label>
                            {transaction?.type === "expense" ? "Transferir para" : "Recebido de"}
                        </Label>
                        <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                            <SelectContent>
                                {targetOptions.map((acc) => {
                                    const bank = banks.find(b => b.id === acc.bank_id);
                                    const iconClass = bank ? bankIconByName(bank.shortName || bank.name) : bankIconByName(acc.name);
                                    const bg = bank?.color || "#999";

                                    return (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[8px]"
                                                    style={{ backgroundColor: bg }}
                                                >
                                                    {iconClass ? (
                                                        <span className={`${iconClass} text-xs text-white`}></span>
                                                    ) : (
                                                        (acc.name).substring(0, 2)
                                                    )}
                                                </div>
                                                <span>{acc.name}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Observation */}
                    <div className="relative">
                        <Input
                            value={observation}
                            onChange={e => setObservation(e.target.value)}
                            placeholder="Observação"
                            className="pl-8"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            {/* Pencil icon placeholder */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        </div>
                    </div>

                    {/* Tags (Simplified for now as text input, ideally a tag selector) */}
                    <div className="relative">
                        <Input
                            value={tags.join(", ")}
                            onChange={e => setTags(e.target.value.split(",").map(t => t.trim()))}
                            placeholder="Tags (separadas por vírgula)"
                            className="pl-8"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <TagIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                </div>
                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="outline" className="w-full text-primary hover:text-primary/90" onClick={() => onOpenChange(false)}>
                        CANCELAR
                    </Button>
                    <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleConvert} disabled={loading || !targetAccountId}>
                        {loading ? "CONVERTENDO..." : "CONVERTER"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
