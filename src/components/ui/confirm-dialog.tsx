import { Dialog, DialogHeader, DialogTitle, DialogBody } from "./dialog";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="space-y-6">
          <p className="text-sm text-zinc-400">{description}</p>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              variant={variant}
              disabled={loading}
            >
              {loading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
}
