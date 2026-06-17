import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mint-500 disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px";

  const variantStyles = {
    primary:
      "bg-neutral-950 text-white shadow-[0_12px_26px_rgba(23,23,23,0.18)] hover:bg-neutral-800",
    secondary:
      "bg-white/84 text-neutral-900 border border-neutral-200 hover:bg-white hover:border-neutral-300",
    outline:
      "bg-transparent text-neutral-950 border border-neutral-300 hover:bg-neutral-950 hover:text-white",
    ghost:
      "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
    danger:
      "bg-red-600 text-white shadow-[0_12px_26px_rgba(220,38,38,0.22)] hover:bg-red-700"
  };

  const sizeStyles = {
    sm: "min-h-11 px-3.5 text-sm rounded-xl",
    md: "min-h-12 px-4 text-base rounded-2xl",
    lg: "min-h-14 px-5 text-base rounded-2xl"
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
