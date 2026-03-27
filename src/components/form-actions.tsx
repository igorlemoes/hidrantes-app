"use client";

import { Button } from "@/components/ui/button";
import { Check, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  cancelText?: string;
  saveText?: string;
  disabled?: boolean;
  className?: string;
}

export function FormActions({
  onCancel,
  onSave,
  saving = false,
  cancelText = "Cancelar",
  saveText = "Salvar",
  disabled = false,
  className,
}: FormActionsProps) {
  return (
    <div className={cn("flex gap-2 pt-4 pb-2", className)}>
      <Button
        variant="outline"
        className="flex-1"
        onClick={onCancel}
      >
        <X className="w-4 h-4 mr-2" />
        {cancelText}
      </Button>
      <Button
        className="flex-1"
        onClick={onSave}
        disabled={saving || disabled}
      >
        {saving ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            {saveText}
          </>
        )}
      </Button>
    </div>
  );
}
