import { Banknote, Clock, Gem, Gift, Heart, Leaf, Phone, RefreshCw, ShieldCheck, Sparkles, Star, Truck, type LucideIcon } from "lucide-react";
import type { valuePropIcons } from "@/lib/validations/homepage";

/** Icons selectable for homepage trust badges (keys stored in settings). */
export const valuePropIconMap: Record<(typeof valuePropIcons)[number], LucideIcon> = {
  truck: Truck,
  refresh: RefreshCw,
  gem: Gem,
  banknote: Banknote,
  shield: ShieldCheck,
  sparkles: Sparkles,
  gift: Gift,
  heart: Heart,
  clock: Clock,
  star: Star,
  leaf: Leaf,
  phone: Phone,
};
