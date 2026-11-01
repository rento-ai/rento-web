"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { routeForNotification } from "@/components/app-routes";
import { Card } from "@/components/card";
import { RentoButton } from "@/components/rento-button";
import { myNotifications, unreadCount, userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

export function NotificationList() {
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const items = myNotifications(db, user);
  const unread = unreadCount(db, user);
  if (!user) return null;

  return (
    <>
      <div className="flex items-center">
        <p className="flex-1 text-sm text-[var(--muted)]">
          {items.length} notifications
        </p>
        {unread ? (
          <RentoButton
            size="sm"
            onClick={() => ApiService.markAllNotificationsRead()}
          >
            Mark all read
          </RentoButton>
        ) : null}
      </div>
      <Card className="flex flex-col">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex items-center gap-3 border-t border-[var(--line)] py-3 text-left first:border-0"
              onClick={async () => {
                await ApiService.markNotificationRead(item.id);
                router.push(routeForNotification(user.role, item.link));
              }}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--teal-tint)] text-[var(--teal)]">
                <Bell className="size-4" />
              </span>
              <span className="flex-1 text-sm font-semibold">
                {item.read ? null : (
                  <span className="mr-1.5 inline-flex rounded-full bg-[var(--saffron)] px-1.5 text-[11px] font-extrabold text-[var(--teal-deep)]">
                    new
                  </span>
                )}
                {item.text}
                <small className="block font-normal text-xs text-[var(--muted)]">
                  {item.at}
                </small>
              </span>
            </button>
          ))
        ) : (
          <div className="py-7 text-center text-sm text-[var(--muted)]">
            You are all caught up.
          </div>
        )}
      </Card>
    </>
  );
}

export default function NotificationsPage() {
  return <NotificationList />;
}
