"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addBed,
  addFloor,
  addProperty,
  addRoom,
  addStaff,
  adjustTenant,
  bulkCreateRooms,
  checkInTenant,
  checkoutTenant,
  confirmComplaint,
  confirmPayment,
  createComplaint,
  createWorkspace,
  deleteAnnouncement,
  deleteFloor,
  generateNextRent,
  markAllRead,
  markNotificationRead,
  postAnnouncement,
  recordNotice,
  recordPayment,
  rejectPayment,
  removeBed,
  removeOrArchiveRoom,
  renameFloor,
  reopenComplaint,
  sendAllReminders,
  sendComplaintMessage,
  sendReminder,
  setStaffPermission,
  signIn,
  signOut,
  submitPaymentProof,
  toggleBedService,
  transferTenant,
  updateComplaint,
  updateProperty,
  updateRoom,
} from "@/lib/pg";
import { seed } from "@/lib/seed";
import type {
  ActionResult,
  AdjustInput,
  AnnouncementInput,
  BulkRoomsInput,
  CheckInInput,
  CheckoutInput,
  ComplaintInput,
  ComplaintUpdateInput,
  EmptyPgInput,
  FloorInput,
  NoticeInput,
  PgDatabase,
  PropertyInput,
  RecordPaymentInput,
  RoomInput,
  RoomUpdateInput,
  StaffInput,
  TransferInput,
} from "@/models/pg.model";

interface PgState {
  hydrated: boolean;
  db: PgDatabase;
  uid: string | null;
  propertyId: string;
  setupPropertyId: string | null;
  setHydrated: () => void;
  setPropertyId: (propertyId: string) => void;
  setSetupPropertyId: (setupPropertyId: string) => void;
  login: (
    email: string,
    password: string,
  ) => ActionResult<{ userId: string; name: string; role: string }>;
  logout: () => ActionResult;
  resetDemo: () => void;
  createEmptyPg: (input: EmptyPgInput) => ActionResult<{ userId: string }>;
  checkIn: (input: CheckInInput) => ReturnType<typeof checkInTenant>;
  recordPayment: (
    input: RecordPaymentInput,
  ) => ReturnType<typeof recordPayment>;
  confirmPayment: (paymentId: string) => ActionResult;
  rejectPayment: (paymentId: string) => ActionResult;
  submitPaymentProof: (utr: string) => ActionResult;
  generateRent: () => ActionResult;
  transfer: (input: TransferInput) => ActionResult;
  notice: (input: NoticeInput) => ActionResult;
  adjust: (input: AdjustInput) => ActionResult;
  checkout: (input: CheckoutInput) => ActionResult;
  updateComplaint: (input: ComplaintUpdateInput) => ActionResult;
  sendComplaintMessage: (complaintId: string, text: string) => ActionResult;
  confirmComplaint: (complaintId: string) => ActionResult;
  reopenComplaint: (complaintId: string) => ActionResult;
  createComplaint: (
    input: ComplaintInput,
  ) => ReturnType<typeof createComplaint>;
  postAnnouncement: (input: AnnouncementInput) => ActionResult;
  deleteAnnouncement: (id: string) => ActionResult;
  setStaffPermission: (
    key: "staffPay" | "staffPrivate",
    value: boolean,
  ) => ActionResult;
  addStaff: (input: StaffInput) => ActionResult;
  markNotificationRead: (id: string) => ReturnType<typeof markNotificationRead>;
  markAllRead: () => ActionResult;
  sendReminder: (tenantId: string) => ActionResult;
  sendAllReminders: () => ActionResult;
  addProperty: (input: PropertyInput) => ReturnType<typeof addProperty>;
  updateProperty: (propertyId: string, input: PropertyInput) => ActionResult;
  addFloor: (input: FloorInput) => ActionResult;
  renameFloor: (floorKey: string, label: string) => ActionResult;
  deleteFloor: (floorKey: string) => ActionResult;
  addRoom: (input: RoomInput) => ActionResult;
  updateRoom: (input: RoomUpdateInput) => ActionResult;
  addBed: (roomId: string) => ActionResult;
  removeBed: (roomId: string, bedId: string) => ActionResult;
  toggleBedService: (bedId: string) => ActionResult;
  removeOrArchiveRoom: (roomId: string) => ActionResult;
  bulkCreateRooms: (input: BulkRoomsInput) => ActionResult;
}

const usePgStore = create<PgState>()(
  persist(
    (set, get) => {
      const commit = <T>(
        run: (db: PgDatabase, uid: string | null) => ActionResult<T>,
      ) => {
        const db = structuredClone(get().db);
        const result = run(db, get().uid);
        if (result.ok) set({ db });
        return result;
      };

      return {
        hydrated: false,
        db: seed(),
        uid: null,
        propertyId: "all",
        setupPropertyId: null,
        setHydrated: () => set({ hydrated: true }),
        setPropertyId: (propertyId) => set({ propertyId }),
        setSetupPropertyId: (setupPropertyId) => set({ setupPropertyId }),
        login: (email, password) => {
          const db = structuredClone(get().db);
          const result = signIn(db, email, password);
          if (result.ok && result.data) set({ db, uid: result.data.userId });
          return result;
        },
        logout: () => {
          const db = structuredClone(get().db);
          const result = signOut(db, get().uid);
          if (result.ok) set({ db, uid: null });
          return result;
        },
        resetDemo: () =>
          set({
            db: seed(),
            uid: null,
            propertyId: "all",
            setupPropertyId: null,
          }),
        createEmptyPg: (input) => {
          const db = createWorkspace(input);
          const result = signIn(db, input.email, input.password);
          if (result.ok && result.data) {
            set({
              db,
              uid: result.data.userId,
              propertyId: "all",
              setupPropertyId: "p1",
            });
            return {
              ok: true,
              data: { userId: result.data.userId },
              message: "Your PG is ready. Add floors and rooms",
            };
          }
          return {
            ok: false,
            error: result.error ?? "Could not create the PG.",
          };
        },
        checkIn: (input) => commit((db, uid) => checkInTenant(db, input, uid)),
        recordPayment: (input) =>
          commit((db, uid) => recordPayment(db, input, uid)),
        confirmPayment: (paymentId) =>
          commit((db, uid) => confirmPayment(db, paymentId, uid)),
        rejectPayment: (paymentId) =>
          commit((db, uid) => rejectPayment(db, paymentId, uid)),
        submitPaymentProof: (utr) =>
          commit((db, uid) => submitPaymentProof(db, utr, uid)),
        generateRent: () => commit((db, uid) => generateNextRent(db, uid)),
        transfer: (input) =>
          commit((db, uid) => transferTenant(db, input, uid)),
        notice: (input) => commit((db, uid) => recordNotice(db, input, uid)),
        adjust: (input) => commit((db, uid) => adjustTenant(db, input, uid)),
        checkout: (input) =>
          commit((db, uid) => checkoutTenant(db, input, uid)),
        updateComplaint: (input) =>
          commit((db, uid) => updateComplaint(db, input, uid)),
        sendComplaintMessage: (complaintId, text) =>
          commit((db, uid) => sendComplaintMessage(db, complaintId, text, uid)),
        confirmComplaint: (complaintId) =>
          commit((db) => confirmComplaint(db, complaintId)),
        reopenComplaint: (complaintId) =>
          commit((db) => reopenComplaint(db, complaintId)),
        createComplaint: (input) =>
          commit((db, uid) => createComplaint(db, input, uid)),
        postAnnouncement: (input) =>
          commit((db, uid) => postAnnouncement(db, input, uid)),
        deleteAnnouncement: (id) => commit((db) => deleteAnnouncement(db, id)),
        setStaffPermission: (key, value) =>
          commit((db, uid) => setStaffPermission(db, key, value, uid)),
        addStaff: (input) => commit((db, uid) => addStaff(db, input, uid)),
        markNotificationRead: (id) =>
          commit((db) => markNotificationRead(db, id)),
        markAllRead: () => commit((db, uid) => markAllRead(db, uid)),
        sendReminder: (tenantId) =>
          commit((db, uid) => sendReminder(db, tenantId, uid)),
        sendAllReminders: () =>
          commit((db, uid) => sendAllReminders(db, get().propertyId, uid)),
        addProperty: (input) => {
          const result = commit((db, uid) => addProperty(db, input, uid));
          if (result.ok && result.data)
            set({ setupPropertyId: result.data.id });
          return result;
        },
        updateProperty: (propertyId, input) =>
          commit((db, uid) => updateProperty(db, propertyId, input, uid)),
        addFloor: (input) =>
          commit((db, uid) =>
            addFloor(
              db,
              get().setupPropertyId ?? db.properties[0]?.id ?? "",
              input,
              uid,
            ),
          ),
        renameFloor: (floorKey, label) =>
          commit((db) =>
            renameFloor(
              db,
              get().setupPropertyId ?? db.properties[0]?.id ?? "",
              floorKey,
              label,
            ),
          ),
        deleteFloor: (floorKey) =>
          commit((db, uid) =>
            deleteFloor(
              db,
              get().setupPropertyId ?? db.properties[0]?.id ?? "",
              floorKey,
              uid,
            ),
          ),
        addRoom: (input) =>
          commit((db, uid) =>
            addRoom(
              db,
              get().setupPropertyId ?? db.properties[0]?.id ?? "",
              input,
              uid,
            ),
          ),
        updateRoom: (input) => commit((db, uid) => updateRoom(db, input, uid)),
        addBed: (roomId) => commit((db, uid) => addBed(db, roomId, uid)),
        removeBed: (roomId, bedId) =>
          commit((db, uid) => removeBed(db, roomId, bedId, uid)),
        toggleBedService: (bedId) =>
          commit((db) => toggleBedService(db, bedId)),
        removeOrArchiveRoom: (roomId) =>
          commit((db, uid) => removeOrArchiveRoom(db, roomId, uid)),
        bulkCreateRooms: (input) =>
          commit((db, uid) =>
            bulkCreateRooms(
              db,
              get().setupPropertyId ?? db.properties[0]?.id ?? "",
              input,
              uid,
            ),
          ),
      };
    },
    {
      name: "rento-pg-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : localStorage,
      ),
      partialize: (state) => ({
        db: state.db,
        uid: state.uid,
        propertyId: state.propertyId,
        setupPropertyId: state.setupPropertyId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export default usePgStore;
