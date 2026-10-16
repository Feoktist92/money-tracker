import { createElement } from 'react';
import {
  ArrowDownRight,
  ArrowDownToLine,
  Banknote,
  Bell,
  Bus,
  ChevronDown,
  Coffee,
  CreditCard,
  Delete,
  Heart,
  House,
  Laptop,
  type LucideIcon,
  MessageSquare,
  PiggyBank,
  RefreshCw,
  Shapes,
  Shirt,
  ShoppingBasket,
  Tv,
} from 'lucide-react-native';

/** Значки по именам, которые хранятся в базе (accounts.icon, categories.icon) и нужны интерфейсу. */
export const ICONS: Readonly<Record<string, LucideIcon>> = {
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  banknote: Banknote,
  'arrow-down-to-line': ArrowDownToLine,
  laptop: Laptop,
  'shopping-basket': ShoppingBasket,
  house: House,
  coffee: Coffee,
  shirt: Shirt,
  bus: Bus,
  tv: Tv,
  heart: Heart,
  'refresh-cw': RefreshCw,
  'chevron-down': ChevronDown,
  'arrow-down-right': ArrowDownRight,
  bell: Bell,
  delete: Delete,
  'message-square': MessageSquare,
};

/** Неизвестное имя (например, из будущей версии базы) не роняет экран, а показывает запасной значок. */
export function resolveIcon(name: string): LucideIcon {
  return Object.hasOwn(ICONS, name) ? ICONS[name]! : Shapes;
}

export function AppIcon({
  name,
  size = 24,
  color,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  // Значок выбирается из статического реестра; createElement, а не <Icon/>, чтобы правило React Compiler не считало это созданием компонента в рендере.
  return createElement(resolveIcon(name), { size, color, strokeWidth, 'aria-hidden': true });
}
