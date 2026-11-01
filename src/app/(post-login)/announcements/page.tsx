"use client";

import { Megaphone } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/card";
import { DeletePopup } from "@/components/delete-popup";
import { Input } from "@/components/input";
import { RentoButton } from "@/components/rento-button";
import { Textarea } from "@/components/textarea";
import { StatusCode } from "@/enums/status-code.enum";
import { formatFullDate } from "@/lib/constants";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

export default function AnnouncementsPage() {
  const announcements = usePgStore((state) => state.db.announcements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const target = announcements.find((item) => item.id === deleteId);

  return (
    <>
      <Card className="flex flex-col gap-3.5">
        <h3 className="text-[17px] font-extrabold">New announcement</h3>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Title
          <Input
            value={title}
            placeholder="e.g. Water supply off on Sunday"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Message
          <Textarea
            value={body}
            placeholder="Details for all tenants"
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <RentoButton
          className="w-fit"
          variant="primary"
          onClick={async () => {
            const response = await ApiService.postAnnouncement({ title, body });
            if (response.status === StatusCode.SuccessOK) {
              setTitle("");
              setBody("");
            }
          }}
        >
          <Megaphone />
          Post to all tenants
        </RentoButton>
      </Card>
      <Card className="flex flex-col gap-4">
        <h3 className="text-[17px] font-extrabold">Posted</h3>
        {announcements.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex-1">
              <b className="text-sm">{item.title}</b>
              <div className="text-xs text-[var(--muted)]">
                {formatFullDate(item.date)}
              </div>
              <p className="mt-1 text-sm">{item.body}</p>
            </div>
            <RentoButton
              size="sm"
              variant="danger"
              onClick={() => setDeleteId(item.id)}
            >
              Delete
            </RentoButton>
          </div>
        ))}
      </Card>
      {target ? (
        <DeletePopup
          title={target.title}
          subHeader="announcement"
          onOpenChange={(open) => {
            if (!open) setDeleteId(null);
          }}
          onSubmit={async () => {
            await ApiService.deleteAnnouncement(target.id);
            setDeleteId(null);
          }}
        />
      ) : null}
    </>
  );
}
