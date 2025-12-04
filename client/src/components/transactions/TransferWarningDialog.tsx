import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface TransferWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function TransferWarningDialog({
    open,
    onOpenChange,
    onConfirm,
}: TransferWarningDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md text-center">
                <AlertDialogHeader className="flex flex-col items-center gap-4">
                    <div className="relative">
                        {/* Placeholder for the illustration in the design - using an icon for now */}
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative">
                            <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                                <AlertTriangle className="w-6 h-6 text-white" fill="currentColor" />
                            </div>
                            <div className="absolute -bottom-2 -left-2 bg-yellow-400 rounded-full p-1">
                                <AlertTriangle className="w-6 h-6 text-white" fill="currentColor" />
                            </div>
                            <AlertTriangle className="w-12 h-12 text-blue-500" />
                        </div>
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">
                        Converter em transferência
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        Ao converter sua transação em transferência, seu saldo também poderá ser afetado por mudanças.
                        <br />
                        <br />
                        Você tem certeza que deseja continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center w-full mt-4">
                    <AlertDialogCancel className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600">
                        CANCELAR
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        onClick={onConfirm}
                    >
                        CONTINUAR
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
