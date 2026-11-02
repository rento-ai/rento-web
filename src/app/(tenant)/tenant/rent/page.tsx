"use client";

import { Card } from "@/components/card";
import { RentoButton } from "@/components/rento-button";
import { StatusPill } from "@/components/status-pill";
import { DuesToneEnum, PaymentStatusEnum } from "@/enums/pg.enum";
import {
  DEMO_TODAY,
  dayDiff,
  formatDayMonth,
  formatInr,
} from "@/lib/constants";
import {
  balance,
  chargesOf,
  owed,
  paidOn,
  tenantById,
  userById,
} from "@/lib/pg";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function TenantRentPage() {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const tenant = tenantById(db, user?.tenantId);
  const openModal = useUiStore((state) => state.openModal);
  if (!tenant) return null;
  const charges = chargesOf(db, tenant.id).sort((a, b) =>
    a.due < b.due ? 1 : -1,
  );
  const payments = db.payments
    .filter(
      (payment) =>
        payment.tenantId === tenant.id && payment.method !== "Credit",
    )
    .slice(0, 12);
  const due = owed(db, tenant);

  return (
    <>
      {due > 0 ? (
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => openModal({ type: "upi" })}
        >
          Pay {formatInr(due)} with UPI
        </RentoButton>
      ) : null}
      <Card className="flex flex-col">
        <h3 className="mb-1 text-[17px] font-extrabold">Monthly charges</h3>
        {charges.map((charge) => {
          const left = balance(db, charge);
          const tone =
            left === 0
              ? DuesToneEnum.paid
              : dayDiff(charge.due, DEMO_TODAY) > 0
                ? paidOn(db, charge.id) > 0
                  ? DuesToneEnum.part
                  : DuesToneEnum.late
                : DuesToneEnum.soon;
          const label =
            left === 0
              ? "Paid"
              : tone === DuesToneEnum.soon
                ? "Due"
                : tone === DuesToneEnum.part
                  ? "Partial"
                  : "Overdue";
          return (
            <div
              key={charge.id}
              className="flex items-center gap-3 border-t border-[var(--line)] py-3 first:border-0"
            >
              <div className="flex-1 text-sm font-semibold">
                {charge.type} · {charge.month}
                <small className="block text-xs font-normal text-[var(--muted)]">
                  Due {formatDayMonth(charge.due)} · {formatInr(charge.amount)}
                  {left > 0 && left < charge.amount
                    ? ` · ${formatInr(left)} left`
                    : ""}
                </small>
              </div>
              <StatusPill tone={tone}>{label}</StatusPill>
            </div>
          );
        })}
      </Card>
      <Card className="flex flex-col">
        <h3 className="mb-1 text-[17px] font-extrabold">Payments</h3>
        {payments.length ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center gap-3 border-t border-[var(--line)] py-3 first:border-0"
            >
              <div className="flex-1 text-sm font-semibold">
                {formatInr(payment.amount)}
                <small className="block text-xs font-normal text-[var(--muted)]">
                  {payment.method} · {formatDayMonth(payment.date)}
                  {payment.status === PaymentStatusEnum.pending
                    ? " · awaiting confirmation"
                    : ""}
                  {payment.status === PaymentStatusEnum.rejected
                    ? " · rejected"
                    : ""}
                </small>
              </div>
              {payment.status === PaymentStatusEnum.pending ? (
                <StatusPill tone={DuesToneEnum.part}>Pending</StatusPill>
              ) : null}
              {payment.status === PaymentStatusEnum.rejected ? (
                <StatusPill tone={DuesToneEnum.late}>Rejected</StatusPill>
              ) : null}
              {payment.receiptNo ? (
                <RentoButton
                  size="sm"
                  onClick={() =>
                    openModal({ type: "receipt", paymentId: payment.id })
                  }
                >
                  Receipt
                </RentoButton>
              ) : null}
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-sm text-[var(--muted)]">
            No payments yet.
          </div>
        )}
      </Card>
    </>
  );
}
