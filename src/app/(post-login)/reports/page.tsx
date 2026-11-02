"use client";

import { Card } from "@/components/card";
import { PaymentStatusEnum, TenantStatusEnum } from "@/enums/pg.enum";
import { DEMO_TODAY, formatInr, monthLabel, percent } from "@/lib/constants";
import { depositBalance, owed, paidOn } from "@/lib/pg";
import usePgStore from "@/store/usePg.store";

export default function ReportsPage() {
  const db = usePgStore((state) => state.db);
  const label = monthLabel(DEMO_TODAY);
  const monthKey = DEMO_TODAY.slice(0, 7);
  const byMethod: Record<string, number> = {};
  let collected = 0;
  for (const payment of db.payments) {
    if (payment.status !== PaymentStatusEnum.confirmed) continue;
    if (!payment.date.startsWith(monthKey)) continue;
    if (["Credit", "Deposit", "Discount"].includes(payment.method)) continue;
    byMethod[payment.method] = (byMethod[payment.method] ?? 0) + payment.amount;
    collected += payment.amount;
  }
  const charges = db.charges.filter((charge) => charge.month === label);
  const due = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const paid = charges.reduce((sum, charge) => sum + paidOn(db, charge.id), 0);
  const deposits = db.tenants
    .filter((tenant) => tenant.status !== TenantStatusEnum.ended)
    .reduce((sum, tenant) => sum + depositBalance(db, tenant.id), 0);
  const outstanding = db.tenants.reduce(
    (sum, tenant) => sum + owed(db, tenant),
    0,
  );
  const top = db.tenants
    .filter(
      (tenant) =>
        tenant.status !== TenantStatusEnum.ended && owed(db, tenant) > 0,
    )
    .sort((a, b) => owed(db, b) - owed(db, a))
    .slice(0, 5);

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={`Collection rate · ${label}`}
          value={`${percent(paid, due || 1)}%`}
          note={`${formatInr(paid)} of ${formatInr(due)}`}
        />
        <Stat
          label="Collected this month"
          value={formatInr(collected)}
          note="all methods"
        />
        <Stat
          label="Deposits held"
          value={formatInr(deposits)}
          note="active tenants"
        />
        <Stat
          label="Total outstanding"
          value={formatInr(outstanding)}
          note="all months"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h3 className="text-[17px] font-extrabold">
            Collected by method · {label}
          </h3>
          {Object.keys(byMethod).map((method) => (
            <div key={method}>
              <div className="flex text-sm font-bold">
                <span>{method}</span>
                <span className="flex-1" />
                <span>{formatInr(byMethod[method] ?? 0)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--gray-tint)]">
                <i
                  className="block h-full bg-[var(--teal)]"
                  style={{
                    width: `${percent(byMethod[method] ?? 0, collected || 1)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </Card>
        <Card className="flex flex-col gap-3">
          <h3 className="text-[17px] font-extrabold">Highest outstanding</h3>
          {top.length ? (
            top.map((tenant) => (
              <div key={tenant.id} className="flex text-sm">
                <b className="flex-1">{tenant.name}</b>
                <span>{formatInr(owed(db, tenant))}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">None</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <small className="text-[13px] font-semibold text-[var(--muted)]">
        {label}
      </small>
      <strong className="mt-1.5 block text-[28px] font-extrabold tracking-tight">
        {value}
      </strong>
      <span className="mt-1 block text-[13px] text-[var(--muted)]">{note}</span>
    </Card>
  );
}
