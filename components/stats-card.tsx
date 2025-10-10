import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: "blue" | "green" | "orange" | "purple" | "red" | "indigo"
  className?: string
  onClick?: () => void
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
  indigo: "bg-indigo-100 text-indigo-600"
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  color = "blue",
  className,
  onClick
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded",
                trend.isPositive 
                  ? "bg-green-50 text-green-700" 
                  : "bg-red-50 text-red-700"
              )}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

