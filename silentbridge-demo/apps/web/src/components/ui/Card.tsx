import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "solid" | "bare";
}

export function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  const variants = {
    default: "panel rounded-[1.35rem]",
    solid: "panel-solid rounded-[1.35rem]",
    bare: "rounded-[1.35rem]"
  };

  return (
    <section className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </section>
  );
}
