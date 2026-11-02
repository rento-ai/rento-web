"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/card";
import { ComplaintDetail } from "@/components/complaint-detail";
import { Segmented } from "@/components/segmented";
import { StatusPill } from "@/components/status-pill";
import { ComplaintFilterEnum, ComplaintStatusEnum } from "@/enums/pg.enum";
import { RoleEnum as AccountRole } from "@/enums/role.enum";
import { formatDayMonth } from "@/lib/constants";
import {
  complaintTone,
  tenantById,
  userById,
  visibleComplaints,
} from "@/lib/pg";
import { cn } from "@/lib/utils";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function ComplaintsPage() {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const complaintId = useUiStore((state) => state.complaintId);
  const setComplaintId = useUiStore((state) => state.setComplaintId);
  const [filter, setFilter] = useState<ComplaintFilterEnum>(
    ComplaintFilterEnum.all,
  );
  const all = visibleComplaints(db, user);
  const hidden =
    user?.role === AccountRole.staff
      ? db.complaints.filter(
          (item) => item.isPrivate && !db.settings.staffPrivate,
        ).length
      : 0;
  const list = all.filter((item) => {
    const done =
      item.status === ComplaintStatusEnum.Closed ||
      item.status === ComplaintStatusEnum.Resolved;
    if (filter === ComplaintFilterEnum.open) return !done;
    if (filter === ComplaintFilterEnum.done) return done;
    return true;
  });
  const selected = list.find((item) => item.id === complaintId) ?? list[0];

  return (
    <>
      <Segmented
        label="Complaints"
        value={filter}
        onChange={setFilter}
        options={[
          { value: ComplaintFilterEnum.all, label: "All" },
          { value: ComplaintFilterEnum.open, label: "Open" },
          { value: ComplaintFilterEnum.done, label: "Resolved" },
        ]}
      />
      {hidden ? (
        <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
          <Lock className="size-4" /> {hidden} private complaint
          {hidden > 1 ? "s are" : " is"} visible to the owner only.
        </p>
      ) : null}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2.5">
          {list.length ? (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex flex-col gap-1.5 rounded-[14px] border bg-white p-3.5 text-left",
                  selected?.id === item.id
                    ? "border-[var(--teal)] shadow-[0_0_0_2px_var(--teal-tint)]"
                    : "border-[var(--line)]",
                )}
                onClick={() => setComplaintId(item.id)}
              >
                <span className="flex items-center gap-2">
                  <b className="flex-1 text-sm">{item.title}</b>
                  <StatusPill tone={complaintTone(item.status)}>
                    {item.status}
                  </StatusPill>
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {tenantById(db, item.tenantId)?.name} · {item.category} ·{" "}
                  {formatDayMonth(item.created)}
                  {item.urgent ? (
                    <b className="text-[var(--red)]"> · URGENT</b>
                  ) : (
                    ""
                  )}
                  {item.isPrivate ? " · private" : ""}
                </span>
              </button>
            ))
          ) : (
            <Card className="text-center text-sm text-[var(--muted)]">
              No complaints.
            </Card>
          )}
        </div>
        {selected ? (
          <ComplaintDetail
            key={`${selected.id}-${selected.status}`}
            complaint={selected}
            tenantView={false}
          />
        ) : (
          <Card className="text-center text-sm text-[var(--muted)]">
            Select a complaint
          </Card>
        )}
      </div>
    </>
  );
}
