import { ArrowUp, ArrowRight, ArrowDown, AlertTriangle } from "lucide-react";
import { IssuePriority } from "@/types";
import { cn } from "@/lib/utils";

interface PriorityIconProps {
  priority: IssuePriority;
  className?: string;
}

const priorityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    label: "Critical",
  },
  high: {
    icon: ArrowUp,
    color: "text-orange-500",
    label: "High",
  },
  medium: {
    icon: ArrowRight,
    color: "text-yellow-500",
    label: "Medium",
  },
  low: {
    icon: ArrowDown,
    color: "text-green-500",
    label: "Low",
  },
};

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Icon
      className={cn("h-4 w-4", config.color, className)}
      aria-label={`Priority: ${config.label}`}
    />
  );
}
