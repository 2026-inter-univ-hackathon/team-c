import { useRef } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  message,
  confirmLabel,
  onConfirm,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => ref.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <dialog ref={ref} className="confirm-dialog" aria-label={message}>
        <p>{message}</p>
        <form method="dialog">
          <Button type="submit" variant="secondary">
            キャンセル
          </Button>
          <Button type="submit" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </form>
      </dialog>
    </>
  );
}
