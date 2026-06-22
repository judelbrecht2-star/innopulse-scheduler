import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} data-slot="input" type={type} className={cn("ip-input", className)} {...props} />
  ),
);
Input.displayName = "Input";

export { Input };
