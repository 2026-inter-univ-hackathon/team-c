import type { ComponentProps, InputHTMLAttributes } from "react";
import { Icon } from "./icon";

type IconName = ComponentProps<typeof Icon>["name"];

export function SearchField({
  icon,
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  icon: IconName;
  label: string;
}) {
  return (
    <label className={["search-field", className].filter(Boolean).join(" ")}>
      <Icon name={icon} />
      <span className="sr-only">{label}</span>
      <input {...props} />
    </label>
  );
}
