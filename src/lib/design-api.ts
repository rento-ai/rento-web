import { StatusCode } from "@/enums/status-code.enum";
import type { ApiResponseModel } from "@/models/api-response.model";
import type {
  ActionResult,
  AdjustInput,
  AnnouncementInput,
  BulkRoomsInput,
  CheckInInput,
  CheckInResultModel,
  CheckoutInput,
  ComplaintInput,
  ComplaintModel,
  ComplaintUpdateInput,
  EmptyPgInput,
  FloorInput,
  NoticeInput,
  PaymentModel,
  PropertyInput,
  PropertyModel,
  RecordPaymentInput,
  RoomInput,
  RoomUpdateInput,
  StaffInput,
  TransferInput,
} from "@/models/pg.model";
import { ToastService } from "@/services/toast.service";
import usePgStore from "@/store/usePg.store";

function fromResult<T>(result: ActionResult<T>): ApiResponseModel<T> {
  if (!result.ok) {
    return {
      status: StatusCode.ClientErrorBadRequest,
      message: result.error ?? "Request failed",
      data: null,
      errors: [{ message: result.error ?? "Request failed" }],
    };
  }
  if (result.message) ToastService.showSuccess(result.message);
  return {
    status: StatusCode.SuccessOK,
    message: result.message ?? "",
    data: (result.data ?? null) as T | null,
    errors: [],
  };
}

/** Design-only local actions. Replace with ApiService when backend endpoints exist. */
const DesignApi = {
  resetDemo() {
    usePgStore.getState().resetDemo();
    return Promise.resolve(
      fromResult({ ok: true, message: "Demo data reset" }),
    );
  },
  createEmptyPg(input: EmptyPgInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().createEmptyPg(input)),
    );
  },
  checkInTenant(input: CheckInInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().checkIn(input)),
    ) as Promise<ApiResponseModel<CheckInResultModel>>;
  },
  recordPayment(input: RecordPaymentInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().recordPayment(input)),
    ) as Promise<ApiResponseModel<PaymentModel>>;
  },
  confirmPayment(paymentId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().confirmPayment(paymentId)),
    );
  },
  rejectPayment(paymentId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().rejectPayment(paymentId)),
    );
  },
  submitPaymentProof(utr: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().submitPaymentProof(utr)),
    );
  },
  generateRent() {
    return Promise.resolve(fromResult(usePgStore.getState().generateRent()));
  },
  transferTenant(input: TransferInput) {
    return Promise.resolve(fromResult(usePgStore.getState().transfer(input)));
  },
  recordNotice(input: NoticeInput) {
    return Promise.resolve(fromResult(usePgStore.getState().notice(input)));
  },
  adjustTenant(input: AdjustInput) {
    return Promise.resolve(fromResult(usePgStore.getState().adjust(input)));
  },
  checkoutTenant(input: CheckoutInput) {
    return Promise.resolve(fromResult(usePgStore.getState().checkout(input)));
  },
  updateComplaint(input: ComplaintUpdateInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().updateComplaint(input)),
    );
  },
  sendComplaintMessage(complaintId: string, text: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().sendComplaintMessage(complaintId, text)),
    );
  },
  confirmComplaint(complaintId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().confirmComplaint(complaintId)),
    );
  },
  reopenComplaint(complaintId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().reopenComplaint(complaintId)),
    );
  },
  createComplaint(input: ComplaintInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().createComplaint(input)),
    ) as Promise<ApiResponseModel<ComplaintModel>>;
  },
  postAnnouncement(input: AnnouncementInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().postAnnouncement(input)),
    );
  },
  deleteAnnouncement(id: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().deleteAnnouncement(id)),
    );
  },
  setStaffPermission(key: "staffPay" | "staffPrivate", value: boolean) {
    return Promise.resolve(
      fromResult(usePgStore.getState().setStaffPermission(key, value)),
    );
  },
  addStaff(input: StaffInput) {
    return Promise.resolve(fromResult(usePgStore.getState().addStaff(input)));
  },
  markNotificationRead(id: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().markNotificationRead(id)),
    );
  },
  markAllNotificationsRead() {
    return Promise.resolve(fromResult(usePgStore.getState().markAllRead()));
  },
  sendReminder(tenantId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().sendReminder(tenantId)),
    );
  },
  sendAllReminders() {
    return Promise.resolve(
      fromResult(usePgStore.getState().sendAllReminders()),
    );
  },
  addProperty(input: PropertyInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().addProperty(input)),
    ) as Promise<ApiResponseModel<PropertyModel>>;
  },
  updateProperty(propertyId: string, input: PropertyInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().updateProperty(propertyId, input)),
    );
  },
  addFloor(input: FloorInput) {
    return Promise.resolve(fromResult(usePgStore.getState().addFloor(input)));
  },
  renameFloor(floorKey: string, label: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().renameFloor(floorKey, label)),
    );
  },
  deleteFloor(floorKey: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().deleteFloor(floorKey)),
    );
  },
  addRoom(input: RoomInput) {
    return Promise.resolve(fromResult(usePgStore.getState().addRoom(input)));
  },
  updateRoom(input: RoomUpdateInput) {
    return Promise.resolve(fromResult(usePgStore.getState().updateRoom(input)));
  },
  addBed(roomId: string) {
    return Promise.resolve(fromResult(usePgStore.getState().addBed(roomId)));
  },
  removeBed(roomId: string, bedId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().removeBed(roomId, bedId)),
    );
  },
  toggleBedService(bedId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().toggleBedService(bedId)),
    );
  },
  removeOrArchiveRoom(roomId: string) {
    return Promise.resolve(
      fromResult(usePgStore.getState().removeOrArchiveRoom(roomId)),
    );
  },
  bulkCreateRooms(input: BulkRoomsInput) {
    return Promise.resolve(
      fromResult(usePgStore.getState().bulkCreateRooms(input)),
    );
  },
};

export default DesignApi;
