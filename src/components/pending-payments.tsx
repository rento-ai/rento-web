"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/card";
import { Initials } from "@/components/initials";
import { RentoButton } from "@/components/rento-button";
import { formatDayMonth, formatInr } from "@/lib/constants";
import { can, inScope, pendingPayments, tenantById, userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

export function PendingPayments() {
  const db = usePgStore((state) => state.db);
  const propertyId = usePgStore((state) => state.propertyId);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const rows = pendingPayments(db, propertyId).filter((payment) =>
    inScope(db, tenantById(db, payment.tenantId), propertyId),
  );
  if (!rows.length || !can(db, user, "confirm")) return null;

  return (
    <Card className="flex flex-col gap-3.5">
      <h3 className="text-[17px] font-extrabold">
        Payments awaiting confirmation ({rows.length})
      </h3>
      {rows.map((payment) => {
        const tenant = tenantById(db, payment.tenantId);
        if (!tenant) return null;
        return (
          <div key={payment.id} className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[180px] flex-1 items-center gap-3">
              <Initials name={tenant.name} />
              <div>
                <b className="text-sm">{tenant.name}</b>
                <div className="text-xs text-[var(--muted)]">
                  {formatInr(payment.amount)} · UTR {payment.reference} ·{" "}
                  {formatDayMonth(payment.date)}
                </div>
              </div>
            </div>
            <RentoButton
              size="sm"
              variant="primary"
              onClick={() => ApiService.confirmPayment(payment.id)}
            >
              <Check />
              Confirm
            </RentoButton>
            <RentoButton
              size="sm"
              variant="danger"
              onClick={() => ApiService.rejectPayment(payment.id)}
            >
              Reject
            </RentoButton>
          </div>
        );
      })}
    </Card>
  );
}
