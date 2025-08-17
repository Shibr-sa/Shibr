import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number | ReactNode
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    label?: string
  }
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  className 
}: StatCardProps) {
  return (
    <Card className={cn("bg-muted/50 border-0 shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs mt-1",
                trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-muted-foreground"
              )}>
                {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}