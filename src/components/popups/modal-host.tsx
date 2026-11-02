"use client";

import {
  ComplaintPopup,
  NewPgPopup,
  PhotoPopup,
  PropertyPopup,
  StaffPopup,
  UpiPopup,
} from "@/components/popups/ops-popups";
import {
  BulkPopup,
  FloorPopup,
  RoomPopup,
} from "@/components/popups/setup-popups";
import {
  AdjustPopup,
  CheckedInPopup,
  CheckInPopup,
  CheckoutPopup,
  NoticePopup,
  PayPopup,
  ReceiptPopup,
  RemindPopup,
  TenantPopup,
  TransferPopup,
} from "@/components/popups/tenant-popups";
import useUiStore from "@/store/useUi.store";

export function ModalHost() {
  const modal = useUiStore((state) => state.modal);
  if (!modal) return null;
  if (modal.type === "new-pg") return <NewPgPopup />;
  if (modal.type === "check-in") return <CheckInPopup bedId={modal.bedId} />;
  if (modal.type === "checked-in")
    return <CheckedInPopup result={modal.result} />;
  if (modal.type === "tenant") return <TenantPopup tenantId={modal.tenantId} />;
  if (modal.type === "pay") return <PayPopup tenantId={modal.tenantId} />;
  if (modal.type === "remind") return <RemindPopup tenantId={modal.tenantId} />;
  if (modal.type === "receipt")
    return <ReceiptPopup paymentId={modal.paymentId} />;
  if (modal.type === "checkout")
    return <CheckoutPopup tenantId={modal.tenantId} />;
  if (modal.type === "transfer")
    return <TransferPopup tenantId={modal.tenantId} />;
  if (modal.type === "notice") return <NoticePopup tenantId={modal.tenantId} />;
  if (modal.type === "adjust") return <AdjustPopup tenantId={modal.tenantId} />;
  if (modal.type === "upi") return <UpiPopup />;
  if (modal.type === "complaint") return <ComplaintPopup />;
  if (modal.type === "photo")
    return <PhotoPopup src={modal.src} label={modal.label} />;
  if (modal.type === "add-staff") return <StaffPopup />;
  if (modal.type === "add-property") return <PropertyPopup />;
  if (modal.type === "edit-property")
    return <PropertyPopup propertyId={modal.propertyId} />;
  if (modal.type === "add-floor") return <FloorPopup />;
  if (modal.type === "rename-floor")
    return <FloorPopup floorKey={modal.floorKey} />;
  if (modal.type === "room")
    return <RoomPopup roomId={modal.roomId} floorKey={modal.floorKey} />;
  return <BulkPopup />;
}
