"use client";

import { useRouter } from "next/navigation";
import { AppRoutes } from "@/components/app-routes";
import { Card } from "@/components/card";
import { Initials } from "@/components/initials";
import { RentoButton } from "@/components/rento-button";
import { DuesToneEnum, TenantStatusEnum } from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import { formatInr } from "@/lib/constants";
import {
  bedsInRoom,
  can,
  duesStatus,
  occupant,
  roomsOnFloor,
  sortedFloors,
  userById,
} from "@/lib/pg";
import { cn } from "@/lib/utils";
import { ToastService } from "@/services/toast.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function BedBoardPage() {
  const router = useRouter();
  const db = usePgStore((state) => state.db);
  const propertyId = usePgStore((state) => state.propertyId);
  const setSetupPropertyId = usePgStore((state) => state.setSetupPropertyId);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const properties = db.properties.filter(
    (property) => propertyId === "all" || property.id === propertyId,
  );

  return (
    <>
      <div className="flex flex-wrap gap-4 text-[13px] text-[var(--muted)]">
        <Legend className="bg-[var(--teal-tint)]" label="Occupied" />
        <Legend
          className="border border-dashed border-[var(--line-strong)] bg-white"
          label="Vacant"
        />
        <Legend className="bg-[var(--amber-tint)]" label="Notice given" />
        <Legend className="bg-[var(--red-tint)]" label="Rent overdue" />
        <Legend className="bg-[var(--gray-tint)]" label="Out of service" />
      </div>
      {properties.map((property) => {
        const floors = sortedFloors(db, property);
        const hasRooms = floors.some((floor) =>
          roomsOnFloor(db, property.id, floor.key).some(
            (room) => !room.archived,
          ),
        );
        return (
          <section key={property.id} className="flex flex-col gap-3.5">
            <h3 className="text-lg font-extrabold">
              {property.name}{" "}
              <span className="text-sm font-medium text-[var(--muted)]">
                · {property.area}
              </span>
            </h3>
            {hasRooms ? (
              floors.map((floor) => {
                const rooms = roomsOnFloor(db, property.id, floor.key).filter(
                  (room) => !room.archived,
                );
                if (!rooms.length) return null;
                return (
                  <div key={floor.key} className="flex flex-col gap-3">
                    <div className="text-xs font-bold tracking-wider text-[var(--muted)] uppercase">
                      {floor.label}
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                      {rooms.map((room) => {
                        const beds = bedsInRoom(db, room.id);
                        const live = beds.filter((bed) => !bed.outOfService);
                        return (
                          <article
                            key={room.id}
                            className="rounded-2xl border border-[var(--line)] bg-white p-3.5"
                          >
                            <header className="mb-2.5 flex items-baseline justify-between text-xs text-[var(--muted)]">
                              <b className="text-base text-[var(--ink)]">
                                Room {room.label}
                              </b>
                              <span>
                                {live.length} bed{live.length === 1 ? "" : "s"}{" "}
                                · {room.type} · {formatInr(room.rent)}
                              </span>
                            </header>
                            <div className="grid grid-cols-2 gap-2">
                              {beds.map((bed) => {
                                if (bed.outOfService) {
                                  return (
                                    <button
                                      key={bed.id}
                                      type="button"
                                      disabled
                                      className="h-[52px] rounded-xl bg-[var(--gray-tint)] px-2 text-left text-xs font-bold text-[var(--gray)] line-through"
                                    >
                                      {bed.label} · Off
                                    </button>
                                  );
                                }
                                const tenant = occupant(db, bed.id);
                                if (!tenant) {
                                  return (
                                    <button
                                      key={bed.id}
                                      type="button"
                                      className="h-[52px] rounded-xl border border-dashed border-[var(--line-strong)] px-2 text-left text-xs font-bold text-[var(--muted)]"
                                      onClick={() => {
                                        if (can(db, user, "checkin"))
                                          openModal({
                                            type: "check-in",
                                            bedId: bed.id,
                                          });
                                        else
                                          ToastService.showSuccess(
                                            "Vacant bed",
                                          );
                                      }}
                                    >
                                      {bed.label} · Vacant
                                    </button>
                                  );
                                }
                                const status = duesStatus(db, tenant);
                                const tone =
                                  tenant.status === TenantStatusEnum.notice
                                    ? "bg-[var(--amber-tint)] text-[var(--amber)]"
                                    : status.tone === DuesToneEnum.late ||
                                        status.tone === DuesToneEnum.part
                                      ? "bg-[var(--red-tint)] text-[var(--red)]"
                                      : "bg-[var(--teal-tint)] text-[var(--teal)]";
                                return (
                                  <button
                                    key={bed.id}
                                    type="button"
                                    className={cn(
                                      "flex h-[52px] items-center gap-2 rounded-xl px-2 text-left text-xs font-bold",
                                      tone,
                                    )}
                                    onClick={() =>
                                      openModal({
                                        type: "tenant",
                                        tenantId: tenant.id,
                                      })
                                    }
                                  >
                                    <Initials
                                      name={tenant.name}
                                      className="size-[30px] text-[11px]"
                                    />
                                    {bed.label}
                                  </button>
                                );
                              })}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <Card className="text-center text-sm text-[var(--muted)]">
                No rooms yet.{" "}
                {user?.role === RoleEnum.owner ? (
                  <RentoButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSetupPropertyId(property.id);
                      router.push(AppRoutes.Setup);
                    }}
                  >
                    Set up floors & rooms
                  </RentoButton>
                ) : (
                  "Ask the owner to set up rooms."
                )}
              </Card>
            )}
          </section>
        );
      })}
    </>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn("inline-block size-3.5 rounded-[5px]", className)} />
      {label}
    </span>
  );
}
