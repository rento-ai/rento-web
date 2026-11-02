"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/card";
import { RentoButton } from "@/components/rento-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { StatusPill } from "@/components/status-pill";
import { Textarea } from "@/components/textarea";
import { ComplaintStatusEnum } from "@/enums/pg.enum";
import { RoleEnum } from "@/enums/role.enum";
import { StatusCode } from "@/enums/status-code.enum";
import { ASSIGNEES, formatDayMonth } from "@/lib/constants";
import { bedInfo, complaintTone, tenantById, userById } from "@/lib/pg";
import { cn } from "@/lib/utils";
import type { ComplaintModel } from "@/models/pg.model";
import ApiService from "@/services/api.service";
import { ToastService } from "@/services/toast.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

export function ComplaintDetail({
  complaint,
  tenantView,
}: {
  complaint: ComplaintModel;
  tenantView: boolean;
}) {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const openModal = useUiStore((state) => state.openModal);
  const tenant = tenantById(db, complaint.tenantId);
  const [status, setStatus] = useState(complaint.status);
  const [assignee, setAssignee] = useState(complaint.assignee || "none");
  const [message, setMessage] = useState("");
  if (!tenant) return null;
  const info = bedInfo(db, tenant.bedId);

  return (
    <Card className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex-1 text-[17px] font-extrabold">{complaint.title}</h3>
        <StatusPill tone={complaintTone(complaint.status)}>
          {complaint.status}
        </StatusPill>
      </div>
      <div className="text-xs text-[var(--muted)]">
        {complaint.category}
        {complaint.urgent ? (
          <b className="text-[var(--red)]"> · URGENT</b>
        ) : null}
        {complaint.isPrivate ? " · private" : ""}
        {tenantView ? "" : ` · ${tenant.name} · ${info.full}`}
        {` · raised ${formatDayMonth(complaint.created)}`}
        {complaint.assignee ? ` · ${complaint.assignee}` : ""}
      </div>
      <p>{complaint.description}</p>
      {complaint.photos.length ? (
        <div className="flex flex-wrap gap-2">
          {complaint.photos.map((photo, index) => (
            <button
              key={photo.slice(0, 24)}
              type="button"
              onClick={() =>
                openModal({
                  type: "photo",
                  src: photo,
                  label: `Photo ${index + 1}`,
                })
              }
            >
              <img
                src={photo}
                alt={`Photo ${index + 1} of the problem`}
                className="size-24 rounded-xl border border-[var(--line)] object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">No photos attached.</p>
      )}
      <div>
        <b className="text-sm">Timeline</b>
        <div className="mt-2.5 ml-1.5 flex flex-col gap-2.5 border-l-2 border-[var(--line)] pl-4">
          {complaint.events.map((event) => (
            <div
              key={`${event.at}-${event.text}`}
              className="relative text-[13px]"
            >
              <span className="absolute top-1 -left-[23px] size-2.5 rounded-full bg-[var(--teal)]" />
              {event.text}
              <small className="block text-xs text-[var(--muted)]">
                {event.at}
              </small>
            </div>
          ))}
        </div>
      </div>
      {!tenantView && user?.role !== RoleEnum.tenant ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Status
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as ComplaintStatusEnum)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ComplaintStatusEnum.Open,
                    ComplaintStatusEnum.Acknowledged,
                    ComplaintStatusEnum.InProgress,
                    ComplaintStatusEnum.Resolved,
                    ComplaintStatusEnum.Closed,
                  ].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
              Assigned to
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {ASSIGNEES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <RentoButton
            variant="primary"
            className="w-fit"
            onClick={async () => {
              const response = await ApiService.updateComplaint({
                complaintId: complaint.id,
                status,
                assignee: assignee === "none" ? "" : assignee,
              });
              if (response.status !== StatusCode.SuccessOK)
                ToastService.showFailure(response.message);
            }}
          >
            Update & notify tenant
          </RentoButton>
        </div>
      ) : null}
      {tenantView && complaint.status === ComplaintStatusEnum.Resolved ? (
        <div className="rounded-[18px] bg-[var(--green-tint)] p-4">
          <p className="text-sm font-bold text-[var(--green)]">
            Marked resolved. Is it fixed?
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <RentoButton
              variant="primary"
              onClick={() => ApiService.confirmComplaint(complaint.id)}
            >
              <Check />
              Yes, it is fixed
            </RentoButton>
            <RentoButton
              onClick={() => ApiService.reopenComplaint(complaint.id)}
            >
              Not fixed, reopen
            </RentoButton>
          </div>
        </div>
      ) : null}
      <div>
        <b className="text-sm">Conversation</b>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {complaint.messages.length ? (
            complaint.messages.map((item) => {
              const mine = tenantView
                ? item.role === RoleEnum.tenant
                : item.role !== RoleEnum.tenant;
              return (
                <div
                  key={`${item.at}-${item.text}`}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm",
                    mine ? "bg-[var(--teal-tint)]" : "bg-[var(--sub)]",
                  )}
                >
                  <small className="mb-0.5 block text-[11px] font-semibold text-[var(--muted)]">
                    {item.by} · {item.at}
                  </small>
                  {item.text}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[var(--muted)]">No messages yet.</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <InputLike value={message} onChange={setMessage} />
          <RentoButton
            variant="primary"
            onClick={async () => {
              if (!message.trim()) return;
              await ApiService.sendComplaintMessage(complaint.id, message);
              setMessage("");
            }}
          >
            Send
          </RentoButton>
        </div>
      </div>
    </Card>
  );
}

function InputLike({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      className="min-h-12"
      value={value}
      placeholder="Write a message"
      aria-label="Message"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
