import { useRef, type ReactNode } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  trigger,
  message,
  confirmLabel,
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      {trigger(() => ref.current?.showModal())}
      <dialog ref={ref} className="confirm-dialog" aria-label={message}>
        <p>{message}</p>
        <form method="dialog">
          <Button type="submit" variant="secondary">
            キャンセル
          </Button>
          <Button
            type="submit"
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </form>
      </dialog>
    </>
  );
}
