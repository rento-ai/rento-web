"use client";

import {
  Bell,
  Home,
  IndianRupee,
  LogOut,
  MessageSquare,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppRoutes } from "@/components/app-routes";
import { Initials } from "@/components/initials";
import { ModalHost } from "@/components/popups/modal-host";
import { Skeleton } from "@/components/skeleton";
import { RoleEnum } from "@/enums/role.enum";
import { bedInfo, tenantById, unreadCount, userById } from "@/lib/pg";
import { cn } from "@/lib/utils";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

const tabs = [
  { href: AppRoutes.TenantHome, label: "Home", icon: Home },
  { href: AppRoutes.TenantRent, label: "Rent", icon: IndianRupee },
  { href: AppRoutes.TenantHelp, label: "Help", icon: MessageSquare },
  { href: AppRoutes.TenantAlerts, label: "Alerts", icon: Bell },
  { href: AppRoutes.TenantProfile, label: "Profile", icon: UserRound },
];

const titles: Record<string, string> = {
  [AppRoutes.TenantHome]: "Home",
  [AppRoutes.TenantRent]: "Rent",
  [AppRoutes.TenantHelp]: "Help",
  [AppRoutes.TenantAlerts]: "Alerts",
  [AppRoutes.TenantProfile]: "Profile",
};

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = usePgStore((state) => state.hydrated);
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const tenant = tenantById(db, user?.tenantId);
  const unread = unreadCount(db, user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(AppRoutes.Login);
    else if (user.role !== RoleEnum.tenant) router.replace(AppRoutes.Dashboard);
  }, [hydrated, user, router]);

  if (!hydrated || !user || !tenant || user.role !== RoleEnum.tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-40" />
      </div>
    );
  }

  const info = bedInfo(db, tenant.bedId);
  const title =
    pathname === AppRoutes.TenantHome
      ? `Hi ${tenant.name.split(" ")[0]}`
      : (titles[pathname] ?? "Rento");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-4 px-[18px] pt-5 pb-28">
      <header className="flex items-center gap-3">
        <Initials name={tenant.name} />
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
          {pathname === AppRoutes.TenantHome && tenant.bedId ? (
            <p className="text-sm text-[var(--muted)]">
              {info.propertyName} · Room {info.full}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white"
          aria-label="Log out"
          onClick={async () => {
            await ApiService.logout();
            router.replace(AppRoutes.Login);
          }}
        >
          <LogOut className="size-5" />
        </button>
      </header>
      {children}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-[480px] grid-cols-5">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex h-[66px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-[var(--muted)]",
                pathname === tab.href && "text-[var(--teal)]",
              )}
            >
              <tab.icon className="size-5" strokeWidth={1.8} />
              {tab.label}
              {tab.href === AppRoutes.TenantAlerts && unread ? (
                <span className="absolute top-1.5 left-[calc(50%+6px)] inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--saffron)] px-1 text-[11px] font-extrabold text-[var(--teal-deep)]">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </nav>
      <ModalHost />
    </div>
  );
}
