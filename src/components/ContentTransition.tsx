import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContentTransitionProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ContentTransition({ 
  isLoading, 
  skeleton, 
  children,
  className 
}: ContentTransitionProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Skeleton with fade out */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          isLoading 
            ? "opacity-100 visible" 
            : "opacity-0 invisible absolute inset-0 pointer-events-none"
        )}
      >
        {skeleton}
      </div>
      
      {/* Content with fade in */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          isLoading 
            ? "opacity-0 invisible absolute inset-0 pointer-events-none" 
            : "opacity-100 visible"
        )}
      >
        {children}
      </div>
    </div>
  );
}
