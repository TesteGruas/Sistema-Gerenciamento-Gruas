'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo'
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function ActionCard({ 
  title, 
  description, 
  icon: Icon, 
  color = 'blue',
  action,
  className = '' 
}: ActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500'
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>
      {action && (
        <CardContent>
          <Button 
            onClick={action.onClick}
            className="w-full"
            variant="outline"
          >
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}