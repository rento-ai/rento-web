"use client";

import { MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppRoutes } from "@/components/app-routes";
import { Card } from "@/components/card";
import { DueRow } from "@/components/due-row";
import { PendingPayments } from "@/components/pending-payments";
import { RentoButton } from "@/components/rento-button";
import { Segmented } from "@/components/segmented";
import { StatusPill } from "@/components/status-pill";
import {
  ComplaintStatusEnum,
  DuesFilterEnum,
  DuesToneEnum,
  TenantStatusEnum,
} from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import {
  DEMO_TODAY,
  formatDayMonth,
  formatFullDate,
  formatInr,
  monthLabel,
  percent,
} from "@/lib/constants";
import {
  bedInfo,
  can,
  complaintTone,
  dueList,
  duesStatus,
  liveTenants,
  occupant,
  openComplaintCount,
  paidOn,
  scopeBeds,
  tenantById,
  userById,
  visibleComplaints,
} from "@/lib/pg";
import type { PgDatabase } from "@/models/pg.model";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

function filledBeds(db: PgDatabase, propertyId: string) {
  const beds = scopeBeds(db, propertyId);
  return { beds, filled: beds.filter((bed) => occupant(db, bed.id)).length };
}

function monthTotals(db: PgDatabase, propertyId: string) {
  const label = monthLabel(DEMO_TODAY);
  const charges = db.charges.filter((charge) => {
    if (charge.month !== label) return false;
    const tenant = tenantById(db, charge.tenantId);
    if (!tenant?.bedId) return propertyId === "all";
    return (
      propertyId === "all" ||
      bedInfo(db, tenant.bedId).propertyId === propertyId
    );
  });
  let due = 0;
  let collected = 0;
  for (const charge of charges) {
    due += charge.amount;
    collected += paidOn(db, charge.id);
  }
  return { due, collected, count: charges.length };
}

export default function DashboardPage() {
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const propertyId = usePgStore((state) => state.propertyId);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const setComplaintId = useUiStore((state) => state.setComplaintId);
  const [filter, setFilter] = useState<DuesFilterEnum>(DuesFilterEnum.late);
  if (!user) return null;

  const people = liveTenants(db, propertyId);
  const { beds, filled } = filledBeds(db, propertyId);
  const collection = monthTotals(db, propertyId);
  const outstanding = people.reduce(
    (sum, tenant) => sum + duesStatus(db, tenant).amount,
    0,
  );
  const late = people.filter(
    (tenant) => duesStatus(db, tenant).tone === DuesToneEnum.late,
  ).length;
  const partial = people.filter(
    (tenant) => duesStatus(db, tenant).tone === DuesToneEnum.part,
  ).length;
  const rows = dueList(db, propertyId, filter).slice(0, 7);
  const notices = people.filter(
    (tenant) => tenant.status === TenantStatusEnum.notice,
  );
  const complaints = visibleComplaints(db, user)
    .filter(
      (item) =>
        item.status !== ComplaintStatusEnum.Closed &&
        item.status !== ComplaintStatusEnum.Resolved,
    )
    .slice(0, 3);

  return (
    <>
      {user.role === RoleEnum.owner && beds.length === 0 ? (
        <Card className="border-0 bg-[var(--teal-tint)]">
          <h3 className="text-[17px] font-extrabold">
            Welcome. Let’s set up your PG
          </h3>
          <p className="mt-2 text-sm">
            Add your floors, rooms and beds the way your building really is. You
            can change everything later.
          </p>
          <RentoButton
            className="mt-3"
            variant="primary"
            onClick={() => router.push(AppRoutes.Setup)}
          >
            Set up floors & rooms
          </RentoButton>
        </Card>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Good morning, {user.name.split(" ")[0]}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {formatFullDate(DEMO_TODAY)} · here is where things stand.
          </p>
        </div>
        <div className="flex-1" />
        {can(db, user, "checkin") ? (
          <RentoButton
            variant="primary"
            onClick={() => openModal({ type: "check-in" })}
          >
            <Plus />
            Check in tenant
          </RentoButton>
        ) : null}
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Occupancy"
          value={`${percent(filled, beds.length)}%`}
          note={`${filled} of ${beds.length} beds filled`}
        />
        {user.role === RoleEnum.owner ? (
          <>
            <Kpi
              label={`Rent due · ${monthLabel(DEMO_TODAY)}`}
              value={formatInr(collection.due)}
              note={`${collection.count} charges`}
            />
            <Card>
              <small className="text-[13px] font-semibold text-[var(--muted)]">
                Collected
              </small>
              <strong className="mt-1.5 block text-[28px] font-extrabold tracking-tight text-[var(--green)]">
                {formatInr(collection.collected)}
              </strong>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[var(--gray-tint)]">
                <i
                  className="block h-full bg-[var(--green)]"
                  style={{
                    width: `${percent(collection.collected, collection.due || 1)}%`,
                  }}
                />
              </div>
            </Card>
            <Kpi
              label="Still to collect"
              value={formatInr(outstanding)}
              note={`${late} overdue · ${partial} partial`}
              warn
            />
          </>
        ) : (
          <>
            <Kpi
              label="Vacant beds"
              value={String(beds.length - filled)}
              note="ready for check-in"
            />
            <Kpi
              label="Open complaints"
              value={String(openComplaintCount(db, user))}
              note="need attention"
            />
            <Kpi
              label="Tenants on notice"
              value={String(notices.length)}
              note="leaving soon"
            />
          </>
        )}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-5">
          <PendingPayments />
          <Card className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="flex-1 text-[17px] font-extrabold">
                Who hasn’t paid
              </h3>
              <Segmented
                label="Filter"
                value={filter}
                onChange={setFilter}
                options={[
                  {
                    value: DuesFilterEnum.late,
                    label: `Overdue ${dueList(db, propertyId, DuesFilterEnum.late).length}`,
                  },
                  {
                    value: DuesFilterEnum.part,
                    label: `Partial ${dueList(db, propertyId, DuesFilterEnum.part).length}`,
                  },
                  {
                    value: DuesFilterEnum.soon,
                    label: `Due soon ${dueList(db, propertyId, DuesFilterEnum.soon).length}`,
                  },
                ]}
              />
            </div>
            {rows.length ? (
              rows.map((tenant) => (
                <DueRow key={tenant.id} tenantId={tenant.id} />
              ))
            ) : (
              <div className="py-7 text-center text-sm text-[var(--muted)]">
                Nothing here. Good news.
              </div>
            )}
            {can(db, user, "pay") &&
            filter === DuesFilterEnum.late &&
            dueList(db, propertyId, DuesFilterEnum.late).length ? (
              <RentoButton
                className="w-fit"
                onClick={() => ApiService.sendAllReminders()}
              >
                <MessageSquare />
                Remind all overdue (
                {dueList(db, propertyId, DuesFilterEnum.late).length})
              </RentoButton>
            ) : null}
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3.5">
            <h3 className="text-[17px] font-extrabold">
              Occupancy by property
            </h3>
            {db.properties.map((property) => {
              const stats = filledBeds(db, property.id);
              return (
                <div key={property.id}>
                  <div className="flex text-sm font-bold">
                    <span>
                      {property.name} · {property.area}
                    </span>
                    <span className="flex-1" />
                    <span>
                      {stats.filled} / {stats.beds.length}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--gray-tint)]">
                    <i
                      className="block h-full bg-[var(--teal)]"
                      style={{
                        width: `${percent(stats.filled, stats.beds.length)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <h3 className="text-[17px] font-extrabold">Open complaints</h3>
            <div className="mt-3 flex flex-col gap-2.5">
              {complaints.length ? (
                complaints.map((complaint) => (
                  <button
                    key={complaint.id}
                    type="button"
                    className="flex flex-col gap-1.5 rounded-[14px] border border-[var(--line)] p-3.5 text-left"
                    onClick={() => {
                      setComplaintId(complaint.id);
                      router.push(AppRoutes.Complaints);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <b className="flex-1 text-sm">{complaint.title}</b>
                      <StatusPill tone={complaintTone(complaint.status)}>
                        {complaint.status}
                      </StatusPill>
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {tenantById(db, complaint.tenantId)?.name} ·{" "}
                      {complaint.category}
                      {complaint.urgent ? " · URGENT" : ""}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  No open complaints.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <h3 className="text-[17px] font-extrabold">Beds opening soon</h3>
            <div className="mt-2">
              {notices.length ? (
                notices.map((tenant) => {
                  const info = bedInfo(db, tenant.bedId);
                  return (
                    <div
                      key={tenant.id}
                      className="flex items-center gap-3 py-2"
                    >
                      <span className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--saffron)] px-2 text-[11px] font-bold text-[var(--teal-deep)]">
                        {info.full.replace(" · ", "")}
                      </span>
                      <div>
                        <div className="text-sm font-bold">
                          {tenant.name} leaving
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {info.propertyName} ·{" "}
                          {tenant.vacate ? formatDayMonth(tenant.vacate) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--muted)]">No notices.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  note,
  warn = false,
}: {
  label: string;
  value: string;
  note: string;
  warn?: boolean;
}) {
  return (
    <Card className={warn ? "border-transparent bg-[var(--warn)]" : ""}>
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
