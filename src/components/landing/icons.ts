import {
  BadgeCheck,
  Clock,
  Droplet,
  Gem,
  Gift,
  Heart,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { benefitIcons } from "@/lib/validations/landing-page";

export const benefitIconMap: Record<(typeof benefitIcons)[number], LucideIcon> = {
  sparkles: Sparkles,
  gem: Gem,
  shield: ShieldCheck,
  truck: Truck,
  clock: Clock,
  leaf: Leaf,
  droplet: Droplet,
  heart: Heart,
  badge: BadgeCheck,
  sun: Sun,
  gift: Gift,
  refresh: RefreshCw,
};

export function benefitIcon(key: string | undefined): LucideIcon {
  return (key && benefitIconMap[key as keyof typeof benefitIconMap]) || Sparkles;
}
