"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { DueRow } from "@/components/due-row";
import { Input } from "@/components/input";
import { RentoButton } from "@/components/rento-button";
import { Segmented } from "@/components/segmented";
import { TenantFilterEnum } from "@/enums/pg.enum";
import { bedInfo, can, userById } from "@/lib/pg";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function TenantsPage() {
  const db = usePgStore((state) => state.db);
  const propertyId = usePgStore((state) => state.propertyId);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const [filter, setFilter] = useState<TenantFilterEnum>(
    TenantFilterEnum.active,
  );
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return db.tenants.filter((tenant) => {
      const info = tenant.bedId ? bedInfo(db, tenant.bedId) : null;
      if (propertyId !== "all" && info?.propertyId !== propertyId) return false;
      if (
        filter !== TenantFilterEnum.all &&
        tenant.status !== (filter as unknown as typeof tenant.status)
      )
        return false;
      if (!needle) return true;
      return `${tenant.name} ${tenant.phone} ${info?.full ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [db, propertyId, filter, query]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-[220px] flex-1"
          placeholder="Search name, phone or room"
          aria-label="Search tenants"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Segmented
          label="Tenant status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: TenantFilterEnum.active, label: "Active" },
            { value: TenantFilterEnum.notice, label: "On notice" },
            { value: TenantFilterEnum.ended, label: "Checked out" },
            { value: TenantFilterEnum.all, label: "All" },
          ]}
        />
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
      <Card>
        {rows.length ? (
          rows.map((tenant) => (
            <DueRow key={tenant.id} tenantId={tenant.id} showRent />
          ))
        ) : (
          <div className="py-7 text-center text-sm text-[var(--muted)]">
            No tenants match.
          </div>
        )}
      </Card>
    </>
  );
}
