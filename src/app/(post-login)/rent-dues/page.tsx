"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import { DueRow } from "@/components/due-row";
import { Input } from "@/components/input";
import { PendingPayments } from "@/components/pending-payments";
import { RentoButton } from "@/components/rento-button";
import { Segmented } from "@/components/segmented";
import { DuesFilterEnum, PaymentStatusEnum } from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import { formatDayMonth, formatInr, nextMonth } from "@/lib/constants";
import { dueList, inScope, tenantById, userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function RentDuesPage() {
  const db = usePgStore((state) => state.db);
  const propertyId = usePgStore((state) => state.propertyId);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const [filter, setFilter] = useState<DuesFilterEnum>(DuesFilterEnum.all);
  const [query, setQuery] = useState("");
  const upcoming = nextMonth();
  const rows = dueList(
    db,
    propertyId,
    filter === DuesFilterEnum.all ? "pending" : filter,
    query,
  );
  const recent = db.payments
    .filter(
      (payment) =>
        payment.status === PaymentStatusEnum.confirmed &&
        payment.method !== "Credit" &&
        inScope(db, tenantById(db, payment.tenantId), propertyId),
    )
    .slice(0, 8);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-[220px] flex-1"
          placeholder="Search tenant or room"
          aria-label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Segmented
          label="Dues"
          value={filter}
          onChange={setFilter}
          options={[
            { value: DuesFilterEnum.all, label: "All pending" },
            { value: DuesFilterEnum.late, label: "Overdue" },
            { value: DuesFilterEnum.part, label: "Partial" },
            { value: DuesFilterEnum.soon, label: "Due soon" },
            { value: DuesFilterEnum.paid, label: "Paid" },
          ]}
        />
        {user?.role === RoleEnum.owner ? (
          <RentoButton onClick={() => ApiService.generateRent()}>
            Generate {upcoming.label} rent
          </RentoButton>
        ) : null}
      </div>
      <PendingPayments />
      <Card>
        {rows.length ? (
          rows.map((tenant) => <DueRow key={tenant.id} tenantId={tenant.id} />)
        ) : (
          <div className="py-7 text-center text-sm text-[var(--muted)]">
            No tenants in this view.
          </div>
        )}
      </Card>
      <Card className="flex flex-col gap-3">
        <h3 className="text-[17px] font-extrabold">Recent payments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                <th className="pb-2 font-semibold">Tenant</th>
                <th className="pb-2 font-semibold">Amount</th>
                <th className="pb-2 font-semibold">Method</th>
                <th className="pb-2 font-semibold">Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recent.map((payment) => (
                <tr key={payment.id} className="border-t border-[var(--line)]">
                  <td className="py-2.5">
                    {tenantById(db, payment.tenantId)?.name}
                  </td>
                  <td className="py-2.5 font-bold">
                    {formatInr(payment.amount)}
                  </td>
                  <td className="py-2.5">{payment.method}</td>
                  <td className="py-2.5">{formatDayMonth(payment.date)}</td>
                  <td className="py-2.5 text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
