"use client";

import { MessageSquare } from "lucide-react";
import { Initials } from "@/components/initials";
import { RentoButton } from "@/components/rento-button";
import { StatusPill } from "@/components/status-pill";
import { DuesToneEnum, TenantStatusEnum } from "@/enums/pg.enum";
import { formatInr } from "@/lib/constants";
import { bedInfo, can, duesStatus, tenantById, userById } from "@/lib/pg";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export function DueRow({
  tenantId,
  showRent = false,
}: {
  tenantId: string;
  showRent?: boolean;
}) {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const tenant = tenantById(db, tenantId);
  if (!tenant) return null;
  const status = duesStatus(db, tenant);
  const info = tenant.bedId
    ? bedInfo(db, tenant.bedId)
    : bedInfo(db, tenant.lastBedId);
  const onNotice =
    tenant.status === TenantStatusEnum.notice &&
    status.tone === DuesToneEnum.paid;

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-[var(--line)] py-3 md:grid-cols-[2.2fr_1fr_1.5fr_auto]">
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 text-left"
        onClick={() => openModal({ type: "tenant", tenantId })}
      >
        <Initials name={tenant.name} />
        <span className="min-w-0">
          <b className="block truncate text-sm">{tenant.name}</b>
          <small className="block truncate text-xs text-[var(--muted)]">
            {showRent ? tenant.phone : `${info.full} · ${info.propertyName}`}
          </small>
        </span>
      </button>
      {showRent ? (
        <div className="text-sm">
          {info.full}
          <div className="text-xs text-[var(--muted)]">{info.propertyName}</div>
        </div>
      ) : (
        <div className="text-sm font-bold">
          {status.amount ? formatInr(status.amount) : "—"}
        </div>
      )}
      <div>
        <StatusPill tone={onNotice ? DuesToneEnum.part : status.tone}>
          {onNotice ? "On notice" : status.text}
        </StatusPill>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {showRent ? (
          <b className="text-sm">{formatInr(tenant.rent)}</b>
        ) : status.tone !== DuesToneEnum.paid &&
          tenant.status !== TenantStatusEnum.ended ? (
          <>
            <RentoButton
              size="sm"
              variant="success"
              onClick={() => openModal({ type: "remind", tenantId })}
            >
              <MessageSquare />
              Remind
            </RentoButton>
            {can(db, user, "pay") ? (
              <RentoButton
                size="sm"
                onClick={() => openModal({ type: "pay", tenantId })}
              >
                Record
              </RentoButton>
            ) : null}
          </>
        ) : (
          <RentoButton
            size="sm"
            onClick={() => openModal({ type: "tenant", tenantId })}
          >
            View
          </RentoButton>
        )}
      </div>
    </div>
  );
}
