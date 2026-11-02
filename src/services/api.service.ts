import { config } from "@/config";
import { ApiMethodsEnum } from "@/enums/api-methods.enum";
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
  LoginResultModel,
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
import fetchApi from "@/services/api-handler";
import { ToastService } from "@/services/toast.service";
import usePgStore from "@/store/usePg.store";

/**
 * Screens call these methods the same way admin calls ApiService.
 * While NEXT_PUBLIC_BACKEND_HOST is empty, each method updates the local store.
 * When the host is set, the same method calls fetchApi and the screen contract stays.
 */
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

export default class ApiService {
  static login(email: string, password: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST) {
      return fetchApi<LoginResultModel>(
        "auth/login",
        { email, password },
        ApiMethodsEnum.post,
      );
    }
    return Promise.resolve(
      fromResult(usePgStore.getState().login(email, password)),
    );
  }

  static logout() {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("auth/logout", {}, ApiMethodsEnum.post);
    return Promise.resolve(fromResult(usePgStore.getState().logout()));
  }

  static resetDemo() {
    usePgStore.getState().resetDemo();
    return Promise.resolve(
      fromResult({ ok: true, message: "Demo data reset" }),
    );
  }

  static createEmptyPg(input: EmptyPgInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("auth/register", input, ApiMethodsEnum.post);
    return Promise.resolve(
      fromResult(usePgStore.getState().createEmptyPg(input)),
    );
  }

  static checkInTenant(input: CheckInInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi<CheckInResultModel>("tenants/check-in", input);
    return Promise.resolve(fromResult(usePgStore.getState().checkIn(input)));
  }

  static recordPayment(input: RecordPaymentInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi<PaymentModel>("payments", input);
    return Promise.resolve(
      fromResult(usePgStore.getState().recordPayment(input)),
    );
  }

  static confirmPayment(paymentId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi(`payments/${encodeURIComponent(paymentId)}/confirm`);
    return Promise.resolve(
      fromResult(usePgStore.getState().confirmPayment(paymentId)),
    );
  }

  static rejectPayment(paymentId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi(`payments/${encodeURIComponent(paymentId)}/reject`);
    return Promise.resolve(
      fromResult(usePgStore.getState().rejectPayment(paymentId)),
    );
  }

  static submitPaymentProof(utr: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("payments/proof", { utr });
    return Promise.resolve(
      fromResult(usePgStore.getState().submitPaymentProof(utr)),
    );
  }

  static generateRent() {
    if (config.NEXT_PUBLIC_BACKEND_HOST) return fetchApi("rent/generate");
    return Promise.resolve(fromResult(usePgStore.getState().generateRent()));
  }

  static transferTenant(input: TransferInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("tenants/transfer", input);
    return Promise.resolve(fromResult(usePgStore.getState().transfer(input)));
  }

  static recordNotice(input: NoticeInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("tenants/notice", input);
    return Promise.resolve(fromResult(usePgStore.getState().notice(input)));
  }

  static adjustTenant(input: AdjustInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("tenants/adjust", input);
    return Promise.resolve(fromResult(usePgStore.getState().adjust(input)));
  }

  static checkoutTenant(input: CheckoutInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("tenants/checkout", input);
    return Promise.resolve(fromResult(usePgStore.getState().checkout(input)));
  }

  static updateComplaint(input: ComplaintUpdateInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("complaints/update", input);
    return Promise.resolve(
      fromResult(usePgStore.getState().updateComplaint(input)),
    );
  }

  static sendComplaintMessage(complaintId: string, text: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("complaints/message", { complaintId, text });
    return Promise.resolve(
      fromResult(usePgStore.getState().sendComplaintMessage(complaintId, text)),
    );
  }

  static confirmComplaint(complaintId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("complaints/confirm", { complaintId });
    return Promise.resolve(
      fromResult(usePgStore.getState().confirmComplaint(complaintId)),
    );
  }

  static reopenComplaint(complaintId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("complaints/reopen", { complaintId });
    return Promise.resolve(
      fromResult(usePgStore.getState().reopenComplaint(complaintId)),
    );
  }

  static createComplaint(input: ComplaintInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi<ComplaintModel>("complaints", input);
    return Promise.resolve(
      fromResult(usePgStore.getState().createComplaint(input)),
    );
  }

  static postAnnouncement(input: AnnouncementInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("announcements", input);
    return Promise.resolve(
      fromResult(usePgStore.getState().postAnnouncement(input)),
    );
  }

  static deleteAnnouncement(id: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST) {
      return fetchApi(
        `announcements/${encodeURIComponent(id)}`,
        {},
        ApiMethodsEnum.delete,
      );
    }
    return Promise.resolve(
      fromResult(usePgStore.getState().deleteAnnouncement(id)),
    );
  }

  static setStaffPermission(key: "staffPay" | "staffPrivate", value: boolean) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("staff/permissions", { key, value });
    return Promise.resolve(
      fromResult(usePgStore.getState().setStaffPermission(key, value)),
    );
  }

  static addStaff(input: StaffInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST) return fetchApi("staff", input);
    return Promise.resolve(fromResult(usePgStore.getState().addStaff(input)));
  }

  static markNotificationRead(id: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi(`notifications/${encodeURIComponent(id)}/read`);
    return Promise.resolve(
      fromResult(usePgStore.getState().markNotificationRead(id)),
    );
  }

  static markAllNotificationsRead() {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("notifications/read-all");
    return Promise.resolve(fromResult(usePgStore.getState().markAllRead()));
  }

  static sendReminder(tenantId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("rent/remind", { tenantId });
    return Promise.resolve(
      fromResult(usePgStore.getState().sendReminder(tenantId)),
    );
  }

  static sendAllReminders() {
    if (config.NEXT_PUBLIC_BACKEND_HOST) return fetchApi("rent/remind-all");
    return Promise.resolve(
      fromResult(usePgStore.getState().sendAllReminders()),
    );
  }

  static addProperty(input: PropertyInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi<PropertyModel>("properties", input);
    return Promise.resolve(
      fromResult(usePgStore.getState().addProperty(input)),
    );
  }

  static updateProperty(propertyId: string, input: PropertyInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi(
        `properties/${encodeURIComponent(propertyId)}`,
        input,
        ApiMethodsEnum.put,
      );
    return Promise.resolve(
      fromResult(usePgStore.getState().updateProperty(propertyId, input)),
    );
  }

  static addFloor(input: FloorInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("properties/floors", input);
    return Promise.resolve(fromResult(usePgStore.getState().addFloor(input)));
  }

  static renameFloor(floorKey: string, label: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("properties/floors/rename", { floorKey, label });
    return Promise.resolve(
      fromResult(usePgStore.getState().renameFloor(floorKey, label)),
    );
  }

  static deleteFloor(floorKey: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi(
        "properties/floors/delete",
        { floorKey },
        ApiMethodsEnum.delete,
      );
    return Promise.resolve(
      fromResult(usePgStore.getState().deleteFloor(floorKey)),
    );
  }

  static addRoom(input: RoomInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST) return fetchApi("rooms", input);
    return Promise.resolve(fromResult(usePgStore.getState().addRoom(input)));
  }

  static updateRoom(input: RoomUpdateInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("rooms/update", input, ApiMethodsEnum.put);
    return Promise.resolve(fromResult(usePgStore.getState().updateRoom(input)));
  }

  static addBed(roomId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("rooms/beds", { roomId });
    return Promise.resolve(fromResult(usePgStore.getState().addBed(roomId)));
  }

  static removeBed(roomId: string, bedId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi(
        "rooms/beds/remove",
        { roomId, bedId },
        ApiMethodsEnum.delete,
      );
    return Promise.resolve(
      fromResult(usePgStore.getState().removeBed(roomId, bedId)),
    );
  }

  static toggleBedService(bedId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("rooms/beds/service", { bedId });
    return Promise.resolve(
      fromResult(usePgStore.getState().toggleBedService(bedId)),
    );
  }

  static removeOrArchiveRoom(roomId: string) {
    if (config.NEXT_PUBLIC_BACKEND_HOST)
      return fetchApi("rooms/archive", { roomId });
    return Promise.resolve(
      fromResult(usePgStore.getState().removeOrArchiveRoom(roomId)),
    );
  }

  static bulkCreateRooms(input: BulkRoomsInput) {
    if (config.NEXT_PUBLIC_BACKEND_HOST) return fetchApi("rooms/bulk", input);
    return Promise.resolve(
      fromResult(usePgStore.getState().bulkCreateRooms(input)),
    );
  }
}
