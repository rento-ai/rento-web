"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppRoutes, ownerRoutes } from "@/components/app-routes";
import { ModalHost } from "@/components/popups/modal-host";
import { AppSidebar, MobileNav } from "@/components/sidebar/sidebar";
import { Skeleton } from "@/components/skeleton";
import { TopBar } from "@/components/top-bar";
import { RoleEnum } from "@/enums/role.enum";
import { userById } from "@/lib/pg";
import usePgStore from "@/store/usePg.store";

export default function PostLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = usePgStore((state) => state.hydrated);
  const user = usePgStore((state) => userById(state.db, state.uid));

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(AppRoutes.Login);
    else if (user.role === RoleEnum.tenant)
      router.replace(AppRoutes.TenantHome);
    else if (user.role !== RoleEnum.owner && ownerRoutes.includes(pathname))
      router.replace(AppRoutes.Dashboard);
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user || user.role === RoleEnum.tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen pb-20 md:pb-0">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-8 py-6 pb-12 max-md:px-4">
          {children}
        </main>
      </div>
      <MobileNav />
      <ModalHost />
    </div>
  );
}
