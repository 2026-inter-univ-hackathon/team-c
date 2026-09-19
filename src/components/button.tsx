import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

function buttonClass(variant: Variant, className?: string) {
  return ["button", variant, className].filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: LinkComponentProps<"a"> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
