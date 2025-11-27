import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState, useRef, useEffect } from "react";
import { ptBR } from "date-fns/locale";
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Calendar as CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DayButton, getDefaultClassNames } from "react-day-picker";

type EventType = 'paid' | 'pending' | 'income-expected' | 'income-received' | 'other';

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  amount: number;
  type: EventType;
}

// Mock data for November 2025 based on prompt context
const initialEvents: CalendarEvent[] = [
  { id: 1, date: new Date(2025, 10, 5), title: "Salário", amount: 5000.00, type: 'income-received' },
  { id: 2, date: new Date(2025, 10, 5), title: "Aluguel", amount: 1500.00, type: 'paid' },
  { id: 3, date: new Date(2025, 10, 10), title: "Conta de Luz", amount: 150.00, type: 'paid' },
  { id: 4, date: new Date(2025, 10, 15), title: "Internet", amount: 100.00, type: 'pending' },
  { id: 5, date: new Date(2025, 10, 20), title: "Freelance", amount: 800.00, type: 'income-expected' },
  { id: 6, date: new Date(2025, 10, 25), title: "Cartão de Crédito", amount: 2340.00, type: 'pending' },
  { id: 7, date: new Date(2025, 10, 28), title: "Academia", amount: 90.00, type: 'pending' },
];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date()); // Defaults to today (Nov 27, 2025 in mock context)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  // Filter events for the selected date
  const selectedDateEvents = events.filter(event => 
    date && 
    event.date.getDate() === date.getDate() && 
    event.date.getMonth() === date.getMonth() && 
    event.date.getFullYear() === date.getFullYear()
  );

  const getDayEvents = (day: Date) => {
    return events.filter(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  const getEventTypeStyles = (type: EventType) => {
    switch (type) {
        case 'paid': return { icon: CheckCircle2, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", label: "Conta Paga" };
        case 'pending': return { icon: Clock, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30", label: "A Pagar" };
        case 'income-received': return { icon: ArrowUpCircle, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Recebido" };
        case 'income-expected': return { icon: ArrowUpCircle, color: "text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/10 dashed border border-emerald-200", label: "Previsto" };
        default: return { icon: CalendarIcon, color: "text-gray-500", bg: "bg-gray-100", label: "Outro" };
    }
  };

  // Custom DayButton to render dots
  function CustomDayButton({
    className,
    day,
    modifiers,
    ...props
  }: React.ComponentProps<typeof DayButton>) {
    const defaultClassNames = getDefaultClassNames();
    const ref = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
      if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    const dayEvents = getDayEvents(day.date);

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-14 w-14 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
          modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          modifiers.today && "bg-accent text-accent-foreground",
          className
        )}
        {...props}
      >
        <span>{day.date.getDate()}</span>
        {dayEvents.length > 0 && (
            <div className="flex gap-1 justify-center mt-0.5">
                {dayEvents.slice(0, 3).map((event, i) => {
                    let colorClass = "bg-gray-400";
                    if (event.type === 'paid') colorClass = "bg-red-400";
                    if (event.type === 'pending') colorClass = "bg-orange-400";
                    if (event.type === 'income-received') colorClass = "bg-emerald-500";
                    if (event.type === 'income-expected') colorClass = "bg-emerald-300";
                    
                    return (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", colorClass)} />
                    );
                })}
                {dayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
            </div>
        )}
      </Button>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendário Financeiro</h1>
          <p className="text-muted-foreground">Visualize seus pagamentos e recebimentos.</p>
        </div>
        
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar ao Calendário</DialogTitle>
                    <DialogDescription>Agende um pagamento ou recebimento futuro.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Título</Label>
                        <Input placeholder="Ex: Seguro do Carro" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Valor</Label>
                        <Input placeholder="R$ 0,00" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Tipo</Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Conta a Pagar</SelectItem>
                                <SelectItem value="income-expected">Receita Prevista</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Data</Label>
                        <Input type="date" className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button>Salvar Evento</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Widget */}
        <div className="lg:col-span-7 xl:col-span-8">
            <Card className="border-none shadow-md h-full">
                <CardContent className="p-6">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={ptBR}
                        className="rounded-md border w-full flex justify-center"
                        classNames={{
                            month: "space-y-4 w-full",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex w-full justify-between",
                            row: "flex w-full mt-2 justify-between",
                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        }}
                        components={{
                            DayButton: CustomDayButton
                        }}
                    />
                    
                    {/* Legend */}
                    <div className="mt-8 flex flex-wrap gap-4 justify-center border-t border-border/50 pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div> Conta Paga
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div> A Pagar
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Recebido
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-3 h-3 rounded-full bg-emerald-300"></div> Previsto
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <Card className="border-none shadow-md bg-slate-50 dark:bg-slate-900/50 h-full">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {date ? date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selecione uma data'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDateEvents.map((event) => {
                                const style = getEventTypeStyles(event.type);
                                return (
                                    <div key={event.id} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all", style.bg, "border-transparent hover:border-border/50")}>
                                        <div className={cn("p-2 rounded-full bg-white/80 dark:bg-black/20 shadow-sm", style.color)}>
                                            <style.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                                            <p className="text-xs text-muted-foreground">{style.label}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-bold font-mono", style.color)}>
                                                R$ {event.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Nenhum evento para este dia.</p>
                            <Button variant="link" className="mt-2 text-primary">Adicionar novo</Button>
                        </div>
                    )}

                    {/* Summary for the day if there are events */}
                    {selectedDateEvents.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-border/20 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total a Pagar</span>
                                <span className="font-bold text-red-500">
                                    R$ {selectedDateEvents.filter(e => e.type === 'pending').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                                </span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Previsto</span>
                                <span className="font-bold text-emerald-500">
                                    R$ {selectedDateEvents.filter(e => e.type === 'income-expected').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}
