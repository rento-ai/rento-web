"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppRoutes } from "@/components/app-routes";
import { Card } from "@/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { RentoButton } from "@/components/rento-button";
import { TenantStatusEnum } from "@/enums/pg.enum";
import { StatusCode } from "@/enums/status-code.enum";
import {
  addDays,
  DEMO_TODAY,
  formatFullDate,
  formatInr,
} from "@/lib/constants";
import { bedInfo, tenantById, userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

export default function TenantProfilePage() {
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const tenant = tenantById(db, user?.tenantId);
  const [vacateOpen, setVacateOpen] = useState(false);
  const [lastDay, setLastDay] = useState(addDays(DEMO_TODAY, 30));
  const [error, setError] = useState("");
  if (!tenant) return null;
  const info = tenant.bedId ? bedInfo(db, tenant.bedId) : null;

  return (
    <>
      <Card>
        <Row label="Name" value={tenant.name} />
        <Row label="Phone" value={tenant.phone} />
        <Row label="Email" value={tenant.email} />
        {info ? <Row label="PG" value={info.propertyName} /> : null}
        {info ? <Row label="Room" value={info.full} /> : null}
        <Row label="Monthly rent" value={formatInr(tenant.rent)} />
        <Row label="Joined" value={formatFullDate(tenant.start)} />
      </Card>
      {tenant.status === TenantStatusEnum.active ? (
        <RentoButton className="w-full" onClick={() => setVacateOpen(true)}>
          Request to vacate
        </RentoButton>
      ) : (
        <Card className="text-sm">
          Leaving on{" "}
          <b>{tenant.vacate ? formatFullDate(tenant.vacate) : "—"}</b>
        </Card>
      )}
      <RentoButton
        className="w-full"
        onClick={async () => {
          await ApiService.logout();
          router.replace(AppRoutes.Login);
        }}
      >
        <LogOut />
        Log out
      </RentoButton>
      <Dialog open={vacateOpen} onOpenChange={setVacateOpen}>
        <DialogContent aria-label="Request to vacate">
          <DialogHeader>
            <DialogTitle>Request to vacate</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Planned last day
              <Input
                type="date"
                value={lastDay}
                onChange={(event) => setLastDay(event.target.value)}
              />
            </label>
            <p className="text-xs text-[var(--muted)]">
              The owner is notified. Your notice period follows your PG’s
              policy.
            </p>
            {error ? (
              <p className="text-[13px] font-semibold text-[var(--red)]">
                {error}
              </p>
            ) : null}
            <RentoButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={async () => {
                const response = await ApiService.recordNotice({
                  tenantId: tenant.id,
                  lastDay,
                });
                if (response.status !== StatusCode.SuccessOK) {
                  setError(response.message);
                  return;
                }
                setVacateOpen(false);
              }}
            >
              Send request
            </RentoButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-[var(--line)] py-2.5 text-sm first:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <b>{value}</b>
    </div>
  );
}
