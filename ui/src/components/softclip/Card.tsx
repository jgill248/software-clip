import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sc-card", className)} {...rest} />;
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
}

export function CardHeader({
  title,
  icon,
  right,
  className,
  children,
  ...rest
}: CardHeaderProps) {
  if (title !== undefined || icon !== undefined || right !== undefined) {
    return (
      <div className={cn("sc-card-header", className)} {...rest}>
        <div className="sc-card-header-title">
          {icon}
          {title}
        </div>
        {right}
      </div>
    );
  }
  return (
    <div className={cn("sc-card-header", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sc-card-body", className)} {...rest} />;
}
