"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/input";
import { PopupFrame } from "@/components/popups/popup-frame";
import { RentoButton } from "@/components/rento-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { StatusCode } from "@/enums/status-code.enum";
import { formatInr, ROOM_TYPES } from "@/lib/constants";
import {
  activeSetupProperty,
  bedRent,
  bedsInRoom,
  floorName,
  occupant,
  planBulkRooms,
  roomById,
  sortedFloors,
  suggestRoomLabel,
} from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export function FloorPopup({ floorKey }: { floorKey?: string }) {
  const db = usePgStore((state) => state.db);
  const setupPropertyId = usePgStore((state) => state.setupPropertyId);
  const closeModal = useUiStore((state) => state.closeModal);
  const property = activeSetupProperty(db, setupPropertyId);
  const floors = property ? sortedFloors(db, property) : [];
  const nextNumber = floors.length
    ? Math.max(
        ...floors.map((floor) =>
          Number.isNaN(Number(floor.key)) ? 0 : Number(floor.key),
        ),
      ) + 1
    : 1;
  const [number, setNumber] = useState(nextNumber);
  const [label, setLabel] = useState(
    floorKey && property ? floorName(property, floorKey) : "",
  );
  const [error, setError] = useState("");
  if (!property) return null;
  return (
    <PopupFrame title={floorKey ? "Rename floor" : "Add floor"}>
      <div className="flex flex-col gap-3.5">
        {floorKey ? null : (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Floor number (0 = Ground)
            <Input
              type="number"
              min={0}
              max={60}
              value={number}
              onChange={(event) => setNumber(Number(event.target.value))}
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Name {floorKey ? "" : "(optional)"}
          <Input
            value={label}
            placeholder="e.g. Terrace annex"
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={async () => {
            const response = floorKey
              ? await ApiService.renameFloor(floorKey, label)
              : await ApiService.addFloor({ number, label });
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          {floorKey ? "Save" : "Add floor"}
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function RoomPopup({
  roomId,
  floorKey,
}: {
  roomId?: string;
  floorKey?: string;
}) {
  const db = usePgStore((state) => state.db);
  const setupPropertyId = usePgStore((state) => state.setupPropertyId);
  const closeModal = useUiStore((state) => state.closeModal);
  const property = activeSetupProperty(db, setupPropertyId);
  const room = roomById(db, roomId);
  const floors = property ? sortedFloors(db, property) : [];
  const initialFloor = room?.floorKey ?? floorKey ?? floors[0]?.key ?? "";
  const [label, setLabel] = useState(
    room?.label ??
      (property && initialFloor
        ? suggestRoomLabel(db, property, initialFloor)
        : ""),
  );
  const [floor, setFloor] = useState(initialFloor);
  const [beds, setBeds] = useState(room ? bedsInRoom(db, room.id).length : 4);
  const [rent, setRent] = useState(room?.rent ?? 6500);
  const [type, setType] = useState(room?.type ?? ROOM_TYPES[0]);
  const [bedRents, setBedRents] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    if (room) {
      for (const bed of bedsInRoom(db, room.id))
        next[bed.id] = bed.rentOverride ? String(bed.rentOverride) : "";
    }
    return next;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (!property) return null;
  if (!room && !floors.length) {
    return (
      <PopupFrame title="Add a room">
        <p className="text-sm text-[var(--muted)]">
          Add a floor first, or use Bulk add rooms.
        </p>
      </PopupFrame>
    );
  }
  const roomBeds = room ? bedsInRoom(db, room.id) : [];
  const used = room
    ? db.tenants.some((tenant) =>
        roomBeds.some(
          (bed) => bed.id === tenant.bedId || bed.id === tenant.lastBedId,
        ),
      )
    : false;

  const saveExisting = async () => {
    if (!room) return false;
    const response = await ApiService.updateRoom({
      roomId: room.id,
      label,
      floorKey: floor,
      rent,
      type,
      bedRents: roomBeds.map((bed) => ({
        id: bed.id,
        rentOverride:
          Number(bedRents[bed.id]) > 0 ? Number(bedRents[bed.id]) : null,
      })),
    });
    if (response.status !== StatusCode.SuccessOK) {
      setError(response.message);
      return false;
    }
    return true;
  };

  return (
    <PopupFrame
      title={room ? `Edit room ${room.label}` : "Add a room"}
      wide={!!room}
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid gap-3 md:grid-cols-2">
          {room ? (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Room number or name
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Floor
            <Select
              value={floor}
              onValueChange={(value) => {
                setFloor(value);
                if (!room) setLabel(suggestRoomLabel(db, property, value));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {floors.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {room ? null : (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Room number or name
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {room ? (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Default rent per bed (₹)
              <Input
                type="number"
                min={1}
                value={rent}
                onChange={(event) => setRent(Number(event.target.value))}
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Number of beds
              <Input
                type="number"
                min={1}
                max={12}
                value={beds}
                onChange={(event) => setBeds(Number(event.target.value))}
              />
            </label>
          )}
          {room ? (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Room type
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : (
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Rent per bed (₹/month)
              <Input
                type="number"
                min={1}
                value={rent}
                onChange={(event) => setRent(Number(event.target.value))}
              />
            </label>
          )}
        </div>
        {room ? null : (
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Room type
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
        {room ? (
          <div>
            <div className="mb-1 flex items-center">
              <b className="flex-1">Beds ({roomBeds.length})</b>
              <RentoButton
                size="sm"
                onClick={async () => {
                  if (await saveExisting()) await ApiService.addBed(room.id);
                }}
              >
                <Plus />
                Add bed
              </RentoButton>
            </div>
            <p className="mb-1.5 text-xs text-[var(--muted)]">
              Optional: give a bed its own rent. Leave blank to use the room
              rent.
            </p>
            {roomBeds.map((bed) => {
              const person = occupant(db, bed.id);
              return (
                <div
                  key={bed.id}
                  className="grid items-center gap-2 border-t border-[var(--line)] py-2 text-[13px] md:grid-cols-[70px_1fr_120px_auto]"
                >
                  <b>Bed {bed.label}</b>
                  <span className="text-[var(--muted)]">
                    {person
                      ? person.name
                      : bed.outOfService
                        ? "Out of service"
                        : "Vacant"}
                  </span>
                  <Input
                    className="h-10 text-[13px]"
                    type="number"
                    min={0}
                    placeholder={String(rent)}
                    aria-label={`Rent override for bed ${bed.label}`}
                    value={bedRents[bed.id] ?? ""}
                    onChange={(event) =>
                      setBedRents((current) => ({
                        ...current,
                        [bed.id]: event.target.value,
                      }))
                    }
                  />
                  {person ? (
                    <span />
                  ) : (
                    <span className="flex gap-1.5">
                      <RentoButton
                        size="sm"
                        onClick={async () => {
                          if (await saveExisting())
                            await ApiService.toggleBedService(bed.id);
                        }}
                      >
                        {bed.outOfService ? "Restore" : "Out of service"}
                      </RentoButton>
                      <RentoButton
                        size="sm"
                        variant="danger"
                        aria-label={`Remove bed ${bed.label}`}
                        onClick={async () => {
                          if (await saveExisting())
                            await ApiService.removeBed(room.id, bed.id);
                        }}
                      >
                        <X />
                      </RentoButton>
                    </span>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-[var(--muted)]">
              Existing tenants keep the rent they agreed. New rent applies to
              new check-ins and transfers. Current override{" "}
              {roomBeds[0] ? formatInr(bedRent(db, roomBeds[0])) : ""}.
            </p>
          </div>
        ) : null}
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            if (room) {
              const saved = await saveExisting();
              setLoading(false);
              if (saved) closeModal();
              return;
            }
            const response = await ApiService.addRoom({
              label,
              floorKey: floor,
              beds,
              rent,
              type,
            });
            setLoading(false);
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          {room ? "Save changes" : "Add room"}
        </RentoButton>
        {room ? (
          <RentoButton
            className="w-full"
            variant={used ? "default" : "danger"}
            onClick={async () => {
              const response = await ApiService.removeOrArchiveRoom(room.id);
              if (response.status !== StatusCode.SuccessOK) {
                setError(response.message);
                return;
              }
              closeModal();
            }}
          >
            {used
              ? room.archived
                ? "Restore room"
                : "Archive room (keeps history)"
              : "Delete room"}
          </RentoButton>
        ) : null}
      </div>
    </PopupFrame>
  );
}

export function BulkPopup() {
  const db = usePgStore((state) => state.db);
  const setupPropertyId = usePgStore((state) => state.setupPropertyId);
  const closeModal = useUiStore((state) => state.closeModal);
  const property = activeSetupProperty(db, setupPropertyId);
  const floors = property ? sortedFloors(db, property) : [];
  const nextFloor = floors.length
    ? Math.max(
        ...floors.map((floor) =>
          Number.isNaN(Number(floor.key)) ? 0 : Number(floor.key),
        ),
      ) + 1
    : 1;
  const [firstFloor, setFirstFloor] = useState(nextFloor);
  const [floorCount, setFloorCount] = useState(3);
  const [roomsPerFloor, setRoomsPerFloor] = useState(8);
  const [bedsPerRoom, setBedsPerRoom] = useState(4);
  const [rent, setRent] = useState(6500);
  const [type, setType] = useState<string>(ROOM_TYPES[0]);
  const [numbering, setNumbering] = useState<"floor2" | "seq" | "dash">(
    "floor2",
  );
  const [loading, setLoading] = useState(false);
  const plan = useMemo(
    () =>
      property
        ? planBulkRooms(db, property.id, {
            firstFloor,
            floors: floorCount,
            roomsPerFloor,
            bedsPerRoom,
            rent,
            type,
            numbering,
          })
        : null,
    [
      db,
      property,
      firstFloor,
      floorCount,
      roomsPerFloor,
      bedsPerRoom,
      rent,
      type,
      numbering,
    ],
  );
  if (!property || !plan) return null;
  return (
    <PopupFrame title="Bulk add rooms" wide>
      <div className="flex flex-col gap-3.5">
        <p className="text-sm text-[var(--muted)]">
          Creates the same layout on each floor. You can edit any single room
          afterwards, so floors can still differ.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            First floor (0 = Ground)
            <Input
              type="number"
              min={0}
              max={60}
              value={firstFloor}
              onChange={(event) => setFirstFloor(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Number of floors
            <Input
              type="number"
              min={1}
              max={30}
              value={floorCount}
              onChange={(event) => setFloorCount(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Rooms on each floor
            <Input
              type="number"
              min={1}
              max={60}
              value={roomsPerFloor}
              onChange={(event) => setRoomsPerFloor(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Beds in each room
            <Input
              type="number"
              min={1}
              max={12}
              value={bedsPerRoom}
              onChange={(event) => setBedsPerRoom(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Rent per bed (₹/month)
            <Input
              type="number"
              min={1}
              value={rent}
              onChange={(event) => setRent(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
            Room type
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Room numbering
          <Select
            value={numbering}
            onValueChange={(value) => setNumbering(value as typeof numbering)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="floor2">
                Floor + 2 digits (101, 102 … 201)
              </SelectItem>
              <SelectItem value="seq">Simple sequence (1, 2, 3 …)</SelectItem>
              <SelectItem value="dash">Floor-room (1-01, 1-02 …)</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="rounded-[18px] bg-[var(--sub)] p-4 text-sm">
          {plan.error ? (
            <span className="font-semibold text-[var(--red)]">
              {plan.error}
            </span>
          ) : (
            <>
              <b>
                {plan.floors.length} floor{plan.floors.length > 1 ? "s" : ""} ·{" "}
                {plan.rooms} rooms · {plan.beds} beds
              </b>
              {plan.skipped ? (
                <div className="text-xs text-[var(--muted)]">
                  {plan.skipped} room number{plan.skipped > 1 ? "s" : ""}{" "}
                  already exist and will be skipped.
                </div>
              ) : null}
              <div className="mt-1.5 text-xs text-[var(--muted)]">
                {plan.floors.slice(0, 5).map((floor) => (
                  <div key={floor.key}>
                    {floorName(property, floor.key)}:{" "}
                    {floor.labels.length
                      ? `${floor.labels[0]}${floor.labels.length > 1 ? ` … ${floor.labels[floor.labels.length - 1]}` : ""}`
                      : "none new"}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!!plan.error}
          onClick={async () => {
            setLoading(true);
            const response = await ApiService.bulkCreateRooms({
              firstFloor,
              floors: floorCount,
              roomsPerFloor,
              bedsPerRoom,
              rent,
              type,
              numbering,
            });
            setLoading(false);
            if (response.status === StatusCode.SuccessOK) closeModal();
          }}
        >
          Create rooms and beds
        </RentoButton>
      </div>
    </PopupFrame>
  );
}
