"use client";

import { Plus } from "lucide-react";
import { Card } from "@/components/card";
import { Initials } from "@/components/initials";
import { RentoButton } from "@/components/rento-button";
import { Switch } from "@/components/switch";
import { RoleEnum } from "@/enums/role.enum";
import { propertyById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function StaffPage() {
  const db = usePgStore((state) => state.db);
  const openModal = useUiStore((state) => state.openModal);
  const staff = db.users.filter((user) => user.role === RoleEnum.staff);

  return (
    <>
      <Card className="flex flex-col gap-3.5">
        <div className="flex items-center">
          <h3 className="flex-1 text-[17px] font-extrabold">Team</h3>
          <RentoButton
            size="sm"
            variant="primary"
            onClick={() => openModal({ type: "add-staff" })}
          >
            <Plus />
            Add staff
          </RentoButton>
        </div>
        {staff.map((person) => (
          <div key={person.id} className="flex items-center gap-3">
            <Initials name={person.name} />
            <div className="flex-1">
              <b className="text-sm">{person.name}</b>
              <div className="text-xs text-[var(--muted)]">
                {person.email} ·{" "}
                {person.propertyId
                  ? propertyById(db, person.propertyId)?.name
                  : "All properties"}
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--gray-tint)] text-xs font-bold text-[var(--gray)]">
            RP
          </span>
          <div>
            <b className="text-sm">Ramesh (Plumber)</b>
            <div className="text-xs text-[var(--muted)]">
              Vendor · no login · assignable on complaints
            </div>
          </div>
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <h3 className="text-[17px] font-extrabold">What staff can do</h3>
        <p className="text-sm text-[var(--muted)]">
          Staff can always view the bed board, check tenants in, start notice
          periods and handle complaints. Money and privacy permissions are yours
          to decide.
        </p>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <Switch
            checked={db.settings.staffPay}
            onCheckedChange={(value) =>
              ApiService.setStaffPermission("staffPay", value === true)
            }
          />
          Can record and confirm payments
        </label>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <Switch
            checked={db.settings.staffPrivate}
            onCheckedChange={(value) =>
              ApiService.setStaffPermission("staffPrivate", value === true)
            }
          />
          Can see private complaints (roommate, safety)
        </label>
        <p className="text-xs text-[var(--muted)]">
          Staff never see financial totals, reports, deposit settlement or the
          audit log. Try it: log out and sign in as Anita.
        </p>
      </Card>
    </>
  );
}
