import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  color?: "blue" | "green" | "orange" | "purple" | "red" | "indigo"
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  disabled?: boolean
  className?: string
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50 hover:bg-blue-100",
    icon: "bg-blue-600 text-white",
    border: "border-blue-200"
  },
  green: {
    bg: "bg-green-50 hover:bg-green-100",
    icon: "bg-green-600 text-white",
    border: "border-green-200"
  },
  orange: {
    bg: "bg-orange-50 hover:bg-orange-100",
    icon: "bg-orange-600 text-white",
    border: "border-orange-200"
  },
  purple: {
    bg: "bg-purple-50 hover:bg-purple-100",
    icon: "bg-purple-600 text-white",
    border: "border-purple-200"
  },
  red: {
    bg: "bg-red-50 hover:bg-red-100",
    icon: "bg-red-600 text-white",
    border: "border-red-200"
  },
  indigo: {
    bg: "bg-indigo-50 hover:bg-indigo-100",
    icon: "bg-indigo-600 text-white",
    border: "border-indigo-200"
  }
}

export function ActionCard({ 
  title, 
  description, 
  icon: Icon,
  href,
  onClick,
  color = "blue",
  badge,
  disabled = false,
  className
}: ActionCardProps) {
  const colors = colorClasses[color]
  
  const handleClick = () => {
    if (disabled) return
    if (href) {
      window.location.href = href
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer border-2",
        colors.border,
        !disabled && "hover:shadow-lg hover:scale-105",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className={cn("p-6", colors.bg)}>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-xl", colors.icon)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
              {badge && (
                <Badge variant={badge.variant || "default"} className="shrink-0">
                  {badge.text}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

