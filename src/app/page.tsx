"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppRoutes } from "@/components/app-routes";
import { Skeleton } from "@/components/skeleton";
import { RoleEnum } from "@/enums/role.enum";
import { userById } from "@/lib/pg";
import usePgStore from "@/store/usePg.store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = usePgStore((state) => state.hydrated);
  const user = usePgStore((state) => userById(state.db, state.uid));

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(AppRoutes.Login);
    else if (user.role === RoleEnum.tenant)
      router.replace(AppRoutes.TenantHome);
    else router.replace(AppRoutes.Dashboard);
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton className="h-12 w-48" />
    </div>
  );
}
