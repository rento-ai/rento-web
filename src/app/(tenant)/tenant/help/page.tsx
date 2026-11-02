"use client";

import { Plus } from "lucide-react";
import { ComplaintDetail } from "@/components/complaint-detail";
import { RentoButton } from "@/components/rento-button";
import { StatusPill } from "@/components/status-pill";
import { formatDayMonth } from "@/lib/constants";
import { complaintTone, userById, visibleComplaints } from "@/lib/pg";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function TenantHelpPage() {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const complaintId = useUiStore((state) => state.complaintId);
  const setComplaintId = useUiStore((state) => state.setComplaintId);
  const openModal = useUiStore((state) => state.openModal);
  const list = visibleComplaints(db, user);
  const selected = list.find((item) => item.id === complaintId);

  if (selected) {
    return (
      <>
        <RentoButton
          size="sm"
          className="w-fit"
          onClick={() => setComplaintId(null)}
        >
          ← All complaints
        </RentoButton>
        <ComplaintDetail
          key={`${selected.id}-${selected.status}`}
          complaint={selected}
          tenantView
        />
      </>
    );
  }

  return (
    <>
      <RentoButton
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => openModal({ type: "complaint" })}
      >
        <Plus />
        New complaint
      </RentoButton>
      {list.length ? (
        list.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex flex-col gap-1.5 rounded-[14px] border border-[var(--line)] bg-white p-3.5 text-left"
            onClick={() => setComplaintId(item.id)}
          >
            <span className="flex items-center gap-2">
              <b className="flex-1 text-sm">{item.title}</b>
              <StatusPill tone={complaintTone(item.status)}>
                {item.status}
              </StatusPill>
            </span>
            <span className="text-xs text-[var(--muted)]">
              {item.category} · {formatDayMonth(item.created)}
              {item.photos.length
                ? ` · ${item.photos.length} photo${item.photos.length > 1 ? "s" : ""}`
                : ""}
            </span>
          </button>
        ))
      ) : (
        <div className="rounded-[18px] border border-[var(--line)] bg-white px-7 py-7 text-center text-sm text-[var(--muted)]">
          No complaints yet. Tap the button to report a problem.
        </div>
      )}
    </>
  );
}
