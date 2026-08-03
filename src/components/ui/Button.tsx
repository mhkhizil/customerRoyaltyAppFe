import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand hover:bg-brand-strong active:bg-brand text-white border-brand shadow-sm dark:text-slate-900",
  secondary:
    "bg-surface hover:bg-surface-muted active:bg-surface text-ink border-line shadow-sm dark:bg-surface-muted dark:text-ink dark:border-line",
  outline:
    "bg-transparent hover:bg-surface-muted active:bg-surface text-ink border-line dark:text-ink dark:border-line dark:hover:bg-surface-muted",
  destructive:
    "bg-surface hover:bg-danger/10 active:bg-danger/15 text-danger border-danger/30 shadow-sm dark:bg-surface dark:text-danger dark:border-danger/40",
  ghost:
    "bg-transparent hover:bg-surface-muted active:bg-surface text-ink-muted border-transparent dark:text-ink-muted dark:hover:bg-surface-muted",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[32px]",
  md: "px-4 py-2 text-sm gap-2 min-h-[40px]",
  lg: "px-5 py-2.5 text-sm gap-2 min-h-[44px]",
};

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={[
          "inline-flex items-center justify-center rounded-lg border font-semibold",
          "transition-all duration-150 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:ring-offset-1 dark:focus:ring-white/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {isLoading ? <Spinner /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
