"use client";

import {
  ChartColumn,
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  List,
  LogOut,
  Megaphone,
  MessageSquare,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppRoutes } from "@/components/app-routes";
import { Initials } from "@/components/initials";
import LucideIcon from "@/components/lucide-icon";
import { RoleEnum } from "@/enums/role.enum";
import { BRAND_NAME } from "@/lib/constants";
import { can, openComplaintCount, pendingPayments, userById } from "@/lib/pg";
import { cn } from "@/lib/utils";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

const items = [
  { href: AppRoutes.Dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: AppRoutes.BedBoard, label: "Bed board", icon: LayoutGrid },
  { href: AppRoutes.Setup, label: "Setup", icon: Settings2, owner: true },
  { href: AppRoutes.Tenants, label: "Tenants", icon: Users },
  {
    href: AppRoutes.RentDues,
    label: "Rent & dues",
    icon: IndianRupee,
    dues: true,
  },
  {
    href: AppRoutes.Complaints,
    label: "Complaints",
    icon: MessageSquare,
    complaints: true,
  },
  {
    href: AppRoutes.Announcements,
    label: "Announcements",
    icon: Megaphone,
    owner: true,
  },
  { href: AppRoutes.Staff, label: "Staff", icon: Shield, owner: true },
  { href: AppRoutes.Reports, label: "Reports", icon: ChartColumn, owner: true },
  { href: AppRoutes.AuditLog, label: "Audit log", icon: List, owner: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  if (!user) return null;
  const complaints = openComplaintCount(db, user);
  const pending = can(db, user, "confirm") ? pendingPayments(db).length : 0;

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-6 bg-[var(--sidebar)] px-4 py-6 text-white md:flex">
      <Link
        href={AppRoutes.Dashboard}
        className="flex items-center gap-3 px-2 text-lg font-extrabold"
      >
        <span className="inline-flex size-[38px] items-center justify-center rounded-xl bg-[var(--saffron)] text-[var(--teal-deep)]">
          <LucideIcon icon={LayoutDashboard} className="size-5" />
        </span>
        {BRAND_NAME}
      </Link>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {items
          .filter((item) => !item.owner || user.role === RoleEnum.owner)
          .map((item) => {
            const badge =
              item.complaints && complaints
                ? complaints
                : item.dues && pending
                  ? pending
                  : 0;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium text-[#B7D3CE]",
                  active && "bg-white/15 font-semibold text-white",
                )}
              >
                <LucideIcon icon={item.icon} />
                <span className="flex-1">{item.label}</span>
                {badge ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--saffron)] px-1.5 text-[11px] font-extrabold text-[var(--teal-deep)]">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>
      <div className="flex flex-col gap-2.5 rounded-[14px] bg-white/10 p-3">
        <div className="flex items-center gap-3">
          <Initials name={user.name} saffron />
          <div className="leading-tight">
            <div className="text-sm font-bold">{user.name}</div>
            <div className="text-xs text-[#B7D3CE] capitalize">{user.role}</div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/25 text-sm font-bold"
          onClick={async () => {
            await ApiService.logout();
            router.replace(AppRoutes.Login);
          }}
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  if (!user) return null;
  const complaints = openComplaintCount(db, user);
  const pending = can(db, user, "confirm") ? pendingPayments(db).length : 0;
  return (
    <nav
      className="no-scrollbar fixed inset-x-0 bottom-0 z-30 flex gap-0.5 overflow-x-auto bg-[var(--sidebar)] px-1.5 py-1.5 md:hidden"
      aria-label="Main"
    >
      {items
        .filter((item) => !item.owner || user.role === RoleEnum.owner)
        .map((item) => {
          const badge =
            item.complaints && complaints
              ? complaints
              : item.dues && pending
                ? pending
                : 0;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-16 flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-[#B7D3CE]",
                active && "text-white",
              )}
            >
              <LucideIcon icon={item.icon} className="size-4" />
              {item.label.split(" ")[0]}
              {badge ? (
                <span className="absolute top-0 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--saffron)] px-1 text-[10px] font-extrabold text-[var(--teal-deep)]">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
    </nav>
  );
}
