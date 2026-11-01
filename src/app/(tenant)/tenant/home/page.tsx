"use client";

import { Camera, Check, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppRoutes } from "@/components/app-routes";
import { Card } from "@/components/card";
import { RentoButton } from "@/components/rento-button";
import { PaymentStatusEnum, TenantStatusEnum } from "@/enums/pg.enum";
import { formatDayMonth, formatFullDate, formatInr } from "@/lib/constants";
import {
  depositBalance,
  duesStatus,
  owed,
  tenantById,
  userById,
} from "@/lib/pg";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function TenantHomePage() {
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const tenant = tenantById(db, user?.tenantId);
  const openModal = useUiStore((state) => state.openModal);
  if (!tenant) return null;
  const due = owed(db, tenant);
  const status = duesStatus(db, tenant);
  const pending = db.payments.find(
    (payment) =>
      payment.tenantId === tenant.id &&
      payment.status === PaymentStatusEnum.pending,
  );
  const receipts = db.payments
    .filter(
      (payment) =>
        payment.tenantId === tenant.id &&
        payment.status === PaymentStatusEnum.confirmed &&
        payment.receiptNo,
    )
    .slice(0, 3);

  return (
    <>
      <section className="rounded-[22px] bg-[var(--teal)] p-5 text-white">
        <small className="text-[13px] font-semibold opacity-85">
          {due > 0
            ? status.tone === "late" || status.tone === "part"
              ? "Overdue rent"
              : "Rent due"
            : "Rent status"}
        </small>
        <strong className="block text-4xl font-extrabold tracking-tight">
          {due > 0 ? formatInr(due) : "All paid"}
        </strong>
        <div className="text-sm opacity-90">
          {due > 0
            ? status.text
            : `Nothing due right now${tenant.credit ? `. Advance credit ${formatInr(tenant.credit)}` : ""}.`}
        </div>
        {due > 0 && pending ? (
          <div className="mt-3.5 rounded-xl bg-white/15 p-3 text-sm">
            Payment of {formatInr(pending.amount)} sent. Waiting for the owner
            to confirm.
          </div>
        ) : null}
        {due > 0 && !pending ? (
          <>
            <RentoButton
              className="mt-3.5 w-full bg-[var(--saffron)] text-[var(--teal-deep)] hover:bg-[var(--saffron)]"
              size="lg"
              onClick={() => openModal({ type: "upi" })}
            >
              Pay with UPI
            </RentoButton>
            <button
              type="button"
              className="mt-1.5 h-11 w-full text-[13px] font-semibold text-white"
              onClick={() => openModal({ type: "upi" })}
            >
              I already paid: share proof
            </button>
          </>
        ) : null}
      </section>
      {tenant.status === TenantStatusEnum.notice ? (
        <Card className="border-0 bg-[var(--amber-tint)]">
          <b className="text-sm text-[var(--amber)]">
            You are leaving on{" "}
            {tenant.vacate ? formatFullDate(tenant.vacate) : "—"}
          </b>
          <p className="mt-1 text-xs text-[var(--amber)]">
            Your deposit will be settled at checkout.
          </p>
        </Card>
      ) : null}
      <Card className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--teal-tint)] text-[var(--teal)]">
          <Lock className="size-5" />
        </span>
        <div className="flex-1 text-sm font-semibold">
          Security deposit
          <small className="block text-xs font-normal text-[var(--muted)]">
            Held by owner · refundable at checkout
          </small>
        </div>
        <b>{formatInr(depositBalance(db, tenant.id))}</b>
      </Card>
      {db.announcements.length ? (
        <Card className="flex flex-col gap-3">
          <h3 className="text-[17px] font-extrabold">Announcements</h3>
          {db.announcements.slice(0, 2).map((item) => (
            <div key={item.id}>
              <b className="text-sm">{item.title}</b>
              <div className="text-xs text-[var(--muted)]">
                {formatDayMonth(item.date)}
              </div>
              <p className="mt-0.5 text-sm">{item.body}</p>
            </div>
          ))}
        </Card>
      ) : null}
      <Card>
        <div className="flex items-center">
          <h3 className="flex-1 text-[17px] font-extrabold">Recent payments</h3>
          <RentoButton
            size="sm"
            onClick={() => router.push(AppRoutes.TenantRent)}
          >
            See all
          </RentoButton>
        </div>
        <div className="mt-2">
          {receipts.length ? (
            receipts.map((payment) => (
              <button
                key={payment.id}
                type="button"
                className="flex w-full items-center gap-3 border-t border-[var(--line)] py-3 text-left"
                onClick={() =>
                  openModal({ type: "receipt", paymentId: payment.id })
                }
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--teal-tint)] text-[var(--teal)]">
                  <Check className="size-5" />
                </span>
                <span className="flex-1 text-sm font-semibold">
                  {formatInr(payment.amount)}
                  <small className="block text-xs font-normal text-[var(--muted)]">
                    {payment.method} · {formatDayMonth(payment.date)} ·{" "}
                    {payment.receiptNo}
                  </small>
                </span>
                <span className="text-sm font-bold text-[var(--teal)]">
                  Receipt
                </span>
              </button>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-[var(--muted)]">
              No payments yet.
            </div>
          )}
        </div>
      </Card>
      <RentoButton
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => openModal({ type: "complaint" })}
      >
        <Camera />
        Report a problem with photo
      </RentoButton>
    </>
  );
}
