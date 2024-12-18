import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300 active:bg-zinc-200 active:text-zinc-900 dark:active:bg-zinc-900 dark:active:text-zinc-200",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-zinc-900 active:text-zinc-200 dark:active:bg-zinc-200 dark:active:text-zinc-900",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/30 hover:bg-accent/30 active:bg-zinc-900 active:text-zinc-200 dark:active:bg-zinc-200 dark:active:text-zinc-900",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-zinc-900 active:text-zinc-200 dark:active:bg-zinc-200 dark:active:text-zinc-900",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/30 hover:bg-accent/30 active:bg-zinc-900 active:text-zinc-200 dark:active:bg-zinc-200 dark:active:text-zinc-900",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 