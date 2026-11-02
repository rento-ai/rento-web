"use client";

import { create } from "zustand";
import type { CheckInResultModel } from "@/models/pg.model";

export type AppModal =
  | { type: "new-pg" }
  | { type: "check-in"; bedId?: string }
  | { type: "checked-in"; result: CheckInResultModel }
  | { type: "tenant"; tenantId: string }
  | { type: "pay"; tenantId: string }
  | { type: "remind"; tenantId: string }
  | { type: "receipt"; paymentId: string }
  | { type: "checkout"; tenantId: string }
  | { type: "transfer"; tenantId: string }
  | { type: "notice"; tenantId: string }
  | { type: "adjust"; tenantId: string }
  | { type: "upi" }
  | { type: "complaint" }
  | { type: "photo"; src: string; label: string }
  | { type: "add-staff" }
  | { type: "add-property" }
  | { type: "edit-property"; propertyId: string }
  | { type: "add-floor" }
  | { type: "rename-floor"; floorKey: string }
  | { type: "room"; roomId?: string; floorKey?: string }
  | { type: "bulk" };

interface UiState {
  modal: AppModal | null;
  complaintId: string | null;
  openModal: (modal: AppModal) => void;
  closeModal: () => void;
  setComplaintId: (complaintId: string | null) => void;
}

const useUiStore = create<UiState>((set) => ({
  modal: null,
  complaintId: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  setComplaintId: (complaintId) => set({ complaintId }),
}));

export default useUiStore;
