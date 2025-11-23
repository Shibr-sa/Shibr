"use client"

import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/localization-context"
import {
  CheckCircle2,
  Clock,
  Package,
  DollarSign,
  FileCheck,
} from "lucide-react"

type ClearanceStatus =
  | "not_started"
  | "pending_inventory_check"
  | "pending_return_shipment"
  | "return_shipped"
  | "return_received"
  | "pending_settlement"
  | "settlement_approved"
  | "payment_completed"
  | "closed"

interface ClearanceStatusBadgeProps {
  status: ClearanceStatus | undefined
}

export function ClearanceStatusBadge({ status }: ClearanceStatusBadgeProps) {
  const { t } = useLanguage()

  if (!status) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {t("clearances.status.unknown")}
      </Badge>
    )
  }

  const config: Record<
    ClearanceStatus,
    { variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ComponentType<{ className?: string }> }
  > = {
    not_started: {
      variant: "outline",
      icon: Clock,
    },
    pending_inventory_check: {
      variant: "outline",
      icon: Clock,
    },
    pending_return_shipment: {
      variant: "outline",
      icon: Package,
    },
    return_shipped: {
      variant: "secondary",
      icon: Package,
    },
    return_received: {
      variant: "default",
      icon: CheckCircle2,
    },
    pending_settlement: {
      variant: "outline",
      icon: DollarSign,
    },
    settlement_approved: {
      variant: "secondary",
      icon: DollarSign,
    },
    payment_completed: {
      variant: "default",
      icon: CheckCircle2,
    },
    closed: {
      variant: "default",
      icon: FileCheck,
    },
  }

  const { variant, icon: Icon } = config[status]

  return (
    <Badge variant={variant} className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {t(`clearances.status.${status}`)}
    </Badge>
  )
}
