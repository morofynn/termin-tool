"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <div className="flex items-center justify-end shrink-0" style={{ width: '44px', minWidth: '44px', maxWidth: '44px' }}>
      <SwitchPrimitive.Root
        data-slot="switch"
        className={cn(
          "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center rounded-full border-2 data-[state=unchecked]:border-gray-400 dark:data-[state=unchecked]:border-gray-500 data-[state=checked]:border-transparent shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          // WICHTIG: !-Präfix für wichtige Dimensionen (überschreibt alles!)
          "!h-6 !w-11 !min-w-[44px] !max-w-[44px] !p-0 !shrink-0",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "bg-white data-[state=unchecked]:bg-white data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            // WICHTIG: !-Präfix für wichtige Dimensionen (überschreibt alles!)
            "!h-5 !w-5 !min-h-[20px] !min-w-[20px] !max-h-[20px] !max-w-[20px] !m-0 !shrink-0"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  )
}

export { Switch }
