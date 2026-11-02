"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/card";
import { DeletePopup } from "@/components/delete-popup";
import { RentoButton } from "@/components/rento-button";
import { Segmented } from "@/components/segmented";
import { StatusPill } from "@/components/status-pill";
import { DuesToneEnum } from "@/enums/pg.enum";
import { formatInr } from "@/lib/constants";
import {
  activeSetupProperty,
  bedRent,
  bedsInRoom,
  occupant,
  propertyRooms,
  roomsOnFloor,
  scopeBeds,
  sortedFloors,
} from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export default function SetupPage() {
  const db = usePgStore((state) => state.db);
  const setupPropertyId = usePgStore((state) => state.setupPropertyId);
  const setSetupPropertyId = usePgStore((state) => state.setSetupPropertyId);
  const openModal = useUiStore((state) => state.openModal);
  const property = activeSetupProperty(db, setupPropertyId);
  const [deleteFloorKey, setDeleteFloorKey] = useState<string | null>(null);
  const floors = property ? sortedFloors(db, property) : [];
  const rooms = property
    ? propertyRooms(db, property.id).filter((room) => !room.archived)
    : [];
  const beds = property ? scopeBeds(db, property.id) : [];
  const occupied = beds.filter((bed) => occupant(db, bed.id)).length;
  const average = beds.length
    ? Math.round(
        beds.reduce((sum, bed) => sum + bedRent(db, bed), 0) / beds.length,
      )
    : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Property"
          value={property?.id ?? ""}
          onChange={setSetupPropertyId}
          options={db.properties.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <RentoButton
          size="sm"
          onClick={() => openModal({ type: "add-property" })}
        >
          <Plus />
          Add property
        </RentoButton>
      </div>
      {!property ? (
        <Card className="text-center text-sm text-[var(--muted)]">
          No property yet. Add your first PG or hostel to begin.
        </Card>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Floors" value={String(floors.length)} />
            <Stat label="Rooms" value={String(rooms.length)} />
            <Stat
              label="Beds"
              value={String(beds.length)}
              note={`${occupied} occupied`}
            />
            <Stat
              label="Average rent / bed"
              value={beds.length ? formatInr(average) : "—"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex-1 text-lg font-extrabold">
              {property.name}{" "}
              <span className="text-sm font-medium text-[var(--muted)]">
                · {property.area}
              </span>
            </h3>
            <RentoButton
              size="sm"
              onClick={() =>
                openModal({ type: "edit-property", propertyId: property.id })
              }
            >
              Edit property
            </RentoButton>
            <RentoButton
              size="sm"
              onClick={() => openModal({ type: "add-floor" })}
            >
              <Plus />
              Add floor
            </RentoButton>
            <RentoButton size="sm" onClick={() => openModal({ type: "room" })}>
              <Plus />
              Add room
            </RentoButton>
            <RentoButton
              size="sm"
              variant="primary"
              onClick={() => openModal({ type: "bulk" })}
            >
              <Plus />
              Bulk add rooms
            </RentoButton>
          </div>
          {!floors.length ? (
            <Card className="flex flex-col gap-3">
              <h3 className="text-[17px] font-extrabold">
                Start with a quick setup
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Tell us how many floors, rooms and beds. We create everything in
                one go. Afterwards, edit any room so different floors can
                differ.
              </p>
              <RentoButton
                className="w-fit"
                variant="primary"
                onClick={() => openModal({ type: "bulk" })}
              >
                Quick setup
              </RentoButton>
            </Card>
          ) : (
            floors.map((floor) => {
              const floorRooms = roomsOnFloor(db, property.id, floor.key);
              return (
                <Card key={floor.key} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="flex-1 text-[17px] font-extrabold">
                      {floor.label}{" "}
                      <span className="text-sm font-medium text-[var(--muted)]">
                        · {floorRooms.filter((room) => !room.archived).length}{" "}
                        rooms
                      </span>
                    </h3>
                    <RentoButton
                      size="sm"
                      onClick={() =>
                        openModal({ type: "room", floorKey: floor.key })
                      }
                    >
                      <Plus />
                      Room here
                    </RentoButton>
                    <RentoButton
                      size="sm"
                      onClick={() =>
                        openModal({ type: "rename-floor", floorKey: floor.key })
                      }
                    >
                      Rename
                    </RentoButton>
                    {!floorRooms.length ? (
                      <RentoButton
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteFloorKey(floor.key)}
                      >
                        Delete floor
                      </RentoButton>
                    ) : null}
                  </div>
                  {floorRooms.length ? (
                    floorRooms.map((room) => {
                      const roomBeds = bedsInRoom(db, room.id);
                      const live = roomBeds.filter((bed) => !bed.outOfService);
                      const staying = roomBeds.filter((bed) =>
                        occupant(db, bed.id),
                      ).length;
                      const rents = live.map((bed) => bedRent(db, bed));
                      const low = Math.min(...rents, room.rent);
                      const high = Math.max(...rents, room.rent);
                      return (
                        <div
                          key={room.id}
                          className="grid items-center gap-3 border-t border-[var(--line)] py-2.5 text-sm md:grid-cols-[1.1fr_1.4fr_1.4fr_1.3fr_auto]"
                        >
                          <b>
                            Room {room.label}{" "}
                            {room.archived ? (
                              <StatusPill tone={DuesToneEnum.gy}>
                                Archived
                              </StatusPill>
                            ) : null}
                          </b>
                          <span className="text-[var(--muted)]">
                            {room.type}
                          </span>
                          <span>
                            {live.length} bed{live.length === 1 ? "" : "s"}
                            {staying ? ` · ${staying} occupied` : ""}
                          </span>
                          <span>
                            {low === high
                              ? formatInr(low)
                              : `${formatInr(low)}–${formatInr(high)}`}{" "}
                            / bed
                          </span>
                          <RentoButton
                            size="sm"
                            onClick={() =>
                              openModal({ type: "room", roomId: room.id })
                            }
                          >
                            Edit
                          </RentoButton>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      No rooms on this floor yet.
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </>
      )}
      {deleteFloorKey ? (
        <DeletePopup
          title="floor"
          subHeader="empty floor"
          onOpenChange={(open) => {
            if (!open) setDeleteFloorKey(null);
          }}
          onSubmit={async () => {
            await ApiService.deleteFloor(deleteFloorKey);
            setDeleteFloorKey(null);
          }}
        />
      ) : null}
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
  note?: string;
}) {
  return (
    <Card>
      <small className="text-[13px] font-semibold text-[var(--muted)]">
        {label}
      </small>
      <strong className="mt-1.5 block text-[28px] font-extrabold tracking-tight">
        {value}
      </strong>
      {note ? (
        <span className="mt-1 block text-[13px] text-[var(--muted)]">
          {note}
        </span>
      ) : null}
    </Card>
  );
}
