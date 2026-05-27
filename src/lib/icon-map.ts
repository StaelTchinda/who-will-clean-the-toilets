import {
  Sparkles,
  ChefHat,
  Wallet,
  Boxes,
  Baby,
  Heart,
  PersonStanding,
  Users,
  UsersRound,
  User,
  X,
  Ban,
  Star,
  Minus,
  AlertTriangle,
  Smile,
  Frown,
  ThumbsUp,
  Clock,
  CalendarCheck,
  CalendarDays,
  RefreshCw,
  ArrowRight,
  Trash2,
  Bed,
  Brush,
  Footprints,
  WashingMachine,
  UtensilsCrossed,
  ShoppingBasket,
  Salad,
  Cookie,
  Stethoscope,
  Hammer,
  HardHat,
  Plane,
  Calculator,
  PiggyBank,
  FileText,
  Send,
  HelpCircle,
  Zap,
  Flame,
  Leaf,
  Home,
  type LucideIcon,
} from "lucide-react";
import type { DomainId } from "./dataset";

export const DOMAIN_ICON: Record<DomainId, LucideIcon> = {
  housekeeping: Sparkles,
  cooking: ChefHat,
  finances: Wallet,
  logistics: Boxes,
  children: Baby,
  values: Heart,
};

// Keyword-based icon lookup on answer id/label. First match wins.
const RULES: Array<{ re: RegExp; icon: LucideIcon }> = [
  // People
  { re: /(^|_)mother$|maman|ma mère|^mom$/i, icon: PersonStanding },
  { re: /(^|_)father$|papa|mon père|^dad$/i, icon: User },
  { re: /^both$|les deux ég|both_fine|both_bother/i, icon: Users },
  { re: /everyone|tout le monde|rotation|alternate|share|partage/i, icon: UsersRound },
  { re: /children|enfants|kids/i, icon: Baby },
  { re: /woman|femme|feminine/i, icon: PersonStanding },
  { re: /man|masculine|homme/i, icon: User },

  // Strong yes / no
  { re: /never|jamais|none|aucun|useless|inutile|dont_think|impossible/i, icon: Ban },
  { re: /no_unfair|^no$|non,/i, icon: X },
  {
    re: /daily|tous les jours|always|toujours|absolute_priority|non_negotiable|essential|indispensable/i,
    icon: Star,
  },
  { re: /expert|love_it|adore|liberating|libérateur/i, icon: Smile },
  { re: /unbearable|insupportable|stressful|stressant|annoying|frown/i, icon: Frown },

  // Frequency / nuance
  { re: /sometimes|parfois|if_time|si j'ai|depends|dépend|maybe|peut/i, icon: Clock },
  {
    re: /rarely|rarement|secondary|basic|decent|fine|good_theory|important_flexible|important/i,
    icon: Minus,
  },
  { re: /yes|oui/i, icon: ThumbsUp },

  // Cleaning subdomains
  { re: /sanitizing|toilettes|sanitaires/i, icon: Brush },
  { re: /vacuuming|aspirateur/i, icon: Sparkles },
  { re: /floors|sols/i, icon: Footprints },
  { re: /tidying|ranger|désencombrer|clutter|keep/i, icon: Boxes },
  { re: /bedding|draps|lit|bedmaking/i, icon: Bed },
  { re: /bins|poubelles|trash/i, icon: Trash2 },
  { re: /laundry|linge|lessive/i, icon: WashingMachine },

  // Food
  { re: /cooking|cuisin|fourneaux/i, icon: ChefHat },
  { re: /dishes|vaisselle/i, icon: UtensilsCrossed },
  { re: /groceries|courses/i, icon: ShoppingBasket },
  { re: /meal|planning|menus|planifier/i, icon: CalendarCheck },
  { re: /balanced|équilibré|salad|healthy/i, icon: Salad },
  { re: /guests|invités|restaurant/i, icon: Cookie },
  { re: /budget|optimiser/i, icon: PiggyBank },

  // Logistics
  { re: /diy|bricol/i, icon: Hammer },
  { re: /contractors|artisan/i, icon: HardHat },
  { re: /travel|voyage|plane/i, icon: Plane },
  { re: /delegate|déléguer/i, icon: Send },

  // Finances/admin
  { re: /finances|argent|money|wallet/i, icon: Wallet },
  { re: /admin|paperasse|paperwork|document/i, icon: FileText },
  { re: /calcul|math/i, icon: Calculator },

  // Kids
  { re: /medical|médecin|santé|stetho/i, icon: Stethoscope },

  // Values
  { re: /neutral|n'importe/i, icon: Minus },
  { re: /feminine_traditional|woman_naturally/i, icon: PersonStanding },

  // Misc fallback hints
  { re: /unknown|inconnu|unsure|sais pas/i, icon: HelpCircle },
  { re: /fast|rapide|quick/i, icon: Zap },
  { re: /intense|passion/i, icon: Flame },
  { re: /calm|tranquille|peaceful/i, icon: Leaf },
  { re: /home|maison|foyer/i, icon: Home },
  { re: /repeat|alterne|cycle/i, icon: RefreshCw },
  { re: /weekly|semaine/i, icon: CalendarDays },
];

export function iconForAnswer(answerId: string, label: string): LucideIcon {
  const hay = `${answerId} ${label}`;
  for (const rule of RULES) {
    if (rule.re.test(hay)) return rule.icon;
  }
  return ArrowRight;
}

// Short, swipeable label (max ~28 chars).
// The `label` parameter is already translated by the caller via tData(), so we
// just truncate if needed. A hardcoded-per-language map is intentionally avoided
// here — it would produce French regardless of the active locale.
export function shortLabel(_answerId: string, label: string): string {
  return label.length > 28 ? label.slice(0, 26).trimEnd() + "…" : label;
}
