import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Pin, Repeat } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

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

type Account = { id: string; name: string };
type Category = { id: string; name: string; type: string; icon: string; color: string };

interface TransactionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: Transaction | null;
    defaultAccountId?: string;
    accounts: Account[];
    categories: Category[];
}

export function TransactionForm({
    open,
    onOpenChange,
    onSuccess,
    initialData,
    defaultAccountId,
    accounts,
    categories,
}: TransactionFormProps) {
    // Form states
    const [description, setDescription] = React.useState("");
    const [amount, setAmount] = React.useState("");
    const [type, setType] = React.useState<"income" | "expense">("expense");
    const [categoryId, setCategoryId] = React.useState("");
    const [accountId, setAccountId] = React.useState("");
    const [dateBr, setDateBr] = React.useState(new Date().toLocaleDateString("pt-BR"));
    const [tags, setTags] = React.useState("");
    const [status, setStatus] = React.useState<"paid" | "pending">("pending");
    const [isFixed, setIsFixed] = React.useState(false);
    const [isRecurring, setIsRecurring] = React.useState(false);
    const [recurrenceFrequency, setRecurrenceFrequency] = React.useState("monthly");
    const [recurrenceCount, setRecurrenceCount] = React.useState("");

    // Helpers
    function formatAmountInput(value: string): string {
        const digits = value.replace(/\D/g, "");
        const num = parseInt(digits || "0", 10);
        const val = num / 100;
        return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function parseAmountToNumber(v: string): number {
        const s = v.replace(/\./g, "").replace(/,(?=\d{2}$)/, ".");
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    }

    function formatNumberToPlain(n: number): string {
        return Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function brToISO(s: string): string {
        const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return new Date().toISOString().slice(0, 10);
        const d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
        return d.toISOString().slice(0, 10);
    }

    function maskDateBr(value: string): string {
        const digits = value.replace(/\D/g, "").slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    }

    function isValidDateBr(s: string): boolean {
        const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return false;
        const d = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10);
        const y = parseInt(m[3], 10);
        const dt = new Date(y, mo - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
    }

    function todayBr(): string {
        return new Date().toLocaleDateString("pt-BR");
    }

    // Reset or Populate form
    React.useEffect(() => {
        if (open) {
            if (initialData) {
                setDescription(initialData.description || "");
                setAmount(formatNumberToPlain(Math.abs(initialData.amount)));
                setType(initialData.amount >= 0 ? "income" : "expense");
                setCategoryId(initialData.category_id || "");
                setAccountId(initialData.account_id ?? "none");
                setDateBr(new Date(initialData.date).toLocaleDateString("pt-BR"));
                setTags(initialData.tags ? initialData.tags.join(", ") : "");
                setStatus(initialData.status || "pending");
                setIsFixed(initialData.is_fixed || false);
                setIsRecurring(initialData.is_recurring || false);
                setRecurrenceFrequency(initialData.recurrence_frequency || "monthly");
                setRecurrenceCount(initialData.recurrence_count ? initialData.recurrence_count.toString() : "");
            } else {
                setDescription("");
                setAmount(formatAmountInput("0"));
                setType("expense");
                setCategoryId("");
                setAccountId(defaultAccountId || "none");
                setDateBr(new Date().toLocaleDateString("pt-BR"));
                setTags("");
                setStatus("pending");
                setIsFixed(false);
                setIsRecurring(false);
                setRecurrenceFrequency("monthly");
                setRecurrenceCount("");
            }
        }
    }, [open, initialData, defaultAccountId]);

    async function handleSave() {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const val = parseAmountToNumber(amount);
        if (isNaN(val)) {
            alert("Valor inválido");
            return;
        }

        const finalAmount = type === "expense" ? -Math.abs(val) : Math.abs(val);
        const tagsArray = tags.split(",").map((t) => t.trim()).filter((t) => t);
        
        if (!categoryId) {
            alert("Selecione uma categoria");
            return;
        }
        
        if (!accountId || accountId === "none") {
            alert("Selecione uma conta");
            return;
        }

        const accountIdValue = accountId === "none" ? null : (accountId || null);

        const baseCount = isRecurring && recurrenceCount ? parseInt(recurrenceCount) : 1;
        const count = isRecurring && !isNaN(baseCount) && baseCount > 0 ? baseCount : 1;

        function addInterval(baseDateStr: string, freq: string, step: number): string {
            const d = new Date(baseDateStr);
            if (freq === "daily") d.setDate(d.getDate() + step);
            else if (freq === "weekly") d.setDate(d.getDate() + 7 * step);
            else if (freq === "monthly") d.setMonth(d.getMonth() + step);
            else if (freq === "yearly") d.setFullYear(d.getFullYear() + step);
            return d.toISOString().slice(0, 10);
        }

        try {
            if (initialData) {
                const payload = {
                    user_id: userData.user.id,
                    description,
                    amount: finalAmount,
                    date: brToISO(dateBr),
                    category_id: categoryId,
                    account_id: accountIdValue,
                    tags: tagsArray,
                    status,
                    is_fixed: isFixed,
                    is_recurring: isRecurring,
                    recurrence_frequency: isRecurring ? recurrenceFrequency : null,
                    recurrence_count: isRecurring ? count : null,
                };
                const { error } = await supabase.from("bank_transactions").update(payload).eq("id", initialData.id);
                if (error) {
                    console.error("Error updating transaction:", error);
                    alert("Erro ao atualizar transação: " + error.message);
                    return;
                }
            } else {
                if (isRecurring) {
                    const payloads = [];
                    let currentBaseDate = brToISO(dateBr);
                    for (let i = 0; i < count; i++) {
                        const dateIso = i === 0 ? currentBaseDate : addInterval(currentBaseDate, recurrenceFrequency, i);
                        payloads.push({
                            user_id: userData.user.id,
                            description: count > 1 ? `${description} (${i + 1}/${count})` : description,
                            amount: finalAmount,
                            date: dateIso,
                            category_id: categoryId,
                            account_id: accountIdValue,
                            tags: tagsArray,
                            status: i === 0 ? status : "pending",
                            is_fixed: isFixed,
                            is_recurring: true,
                            recurrence_frequency: recurrenceFrequency,
                            recurrence_count: count,
                        });
                    }
                    const { error } = await supabase.from("bank_transactions").insert(payloads);
                    if (error) {
                        console.error("Error inserting recurring transactions:", error);
                        alert("Erro ao criar transações recorrentes: " + error.message);
                        return;
                    }
                } else {
                    const payload = {
                        user_id: userData.user.id,
                        description,
                        amount: finalAmount,
                        date: brToISO(dateBr),
                        category_id: categoryId,
                        account_id: accountIdValue,
                        tags: tagsArray,
                        status,
                        is_fixed: isFixed,
                        is_recurring: false,
                        recurrence_frequency: null,
                        recurrence_count: null,
                    };
                    const { error } = await supabase.from("bank_transactions").insert(payload);
                    if (error) {
                        console.error("Error inserting transaction:", error);
                        alert("Erro ao criar transação: " + error.message);
                        return;
                    }
                }
            }
            onSuccess();
            onOpenChange(false);
        } catch (err) {
            console.error("Unexpected error:", err);
            alert("Erro inesperado ao salvar");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Transação" : "Adicionar Transação"}</DialogTitle>
                    <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Supermercado"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Despesa</SelectItem>
                                    <SelectItem value="income">Receita</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    value={dateBr}
                                    onChange={(e) => setDateBr(maskDateBr(e.target.value))}
                                    onBlur={() => setDateBr(isValidDateBr(dateBr) ? dateBr : todayBr())}
                                    placeholder="dd/mm/aaaa"
                                />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <CalendarIcon className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={new Date(brToISO(dateBr))}
                                            locale={ptBR}
                                            onDayClick={(day) => setDateBr(day.toLocaleDateString("pt-BR"))}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Conta Bancária</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione (Opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma</SelectItem>
                                    {accounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Pago / Recebido</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tags (separadas por vírgula)</Label>
                            <Input
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Ex: mercado, semanal"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border p-3 rounded-md">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="fixed" checked={isFixed} onCheckedChange={(c: boolean) => setIsFixed(c)} />
                            <Label htmlFor="fixed" className="cursor-pointer flex items-center gap-1">
                                <Pin className="w-3 h-3" /> Fixa
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="recurring"
                                checked={isRecurring}
                                onCheckedChange={(c: boolean) => setIsRecurring(c)}
                            />
                            <Label htmlFor="recurring" className="cursor-pointer flex items-center gap-1">
                                <Repeat className="w-3 h-3" /> Recorrente
                            </Label>
                        </div>
                    </div>

                    {isRecurring && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md">
                            <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Diária</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Qtd. Repetições</Label>
                                <Input
                                    type="number"
                                    value={recurrenceCount}
                                    onChange={(e) => setRecurrenceCount(e.target.value)}
                                    placeholder="Ex: 12 (vazio = infinito)"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
