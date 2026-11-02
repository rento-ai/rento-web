"use client";

import { Bell, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AppRoutes, propertyFilterRoutes } from "@/components/app-routes";
import LucideIcon from "@/components/lucide-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { unreadCount, userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

const titles: Record<string, string> = {
  [AppRoutes.Dashboard]: "Dashboard",
  [AppRoutes.BedBoard]: "Bed board",
  [AppRoutes.Setup]: "Setup: floors, rooms & beds",
  [AppRoutes.Tenants]: "Tenants",
  [AppRoutes.RentDues]: "Rent & dues",
  [AppRoutes.Complaints]: "Complaints",
  [AppRoutes.Announcements]: "Announcements",
  [AppRoutes.Staff]: "Staff & permissions",
  [AppRoutes.Reports]: "Reports",
  [AppRoutes.AuditLog]: "Audit log",
  [AppRoutes.Notifications]: "Notifications",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const propertyId = usePgStore((state) => state.propertyId);
  const setPropertyId = usePgStore((state) => state.setPropertyId);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const notes = unreadCount(db, user);

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)] px-8 py-4 max-md:px-4">
      <h1 className="text-[22px] font-extrabold tracking-tight">
        {titles[pathname] ?? "Rento"}
      </h1>
      <div className="flex-1" />
      {propertyFilterRoutes.includes(pathname) ? (
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger
            className="h-11 w-auto min-w-[180px]"
            aria-label="Property"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {db.properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <button
        type="button"
        className="relative inline-flex size-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white"
        aria-label="Notifications"
        onClick={() => router.push(AppRoutes.Notifications)}
      >
        <LucideIcon icon={Bell} />
        {notes ? (
          <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--saffron)] px-1 text-[11px] font-extrabold text-[var(--teal-deep)]">
            {notes}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white"
        aria-label="Log out"
        onClick={async () => {
          await ApiService.logout();
          router.replace(AppRoutes.Login);
        }}
      >
        <LucideIcon icon={LogOut} />
      </button>
    </header>
  );
}
