"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppRoutes } from "@/components/app-routes";
import { Checkbox } from "@/components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
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
import { Textarea } from "@/components/textarea";
import { BedStyleEnum } from "@/enums/pg.enum";
import { StatusCode } from "@/enums/status-code.enum";
import { COMPLAINT_CATEGORIES, formatInr } from "@/lib/constants";
import { bedInfo, owed, tenantById, userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

function SampleQr() {
  const cells = useMemo(() => {
    const marks: { x: number; y: number }[] = [];
    let seed = 1;
    for (let y = 0; y < 21; y += 1) {
      for (let x = 0; x < 21; x += 1) {
        const finder =
          (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        let on = false;
        if (finder) {
          let fx = x % 14;
          let fy = y % 14;
          if (x > 13) fx = x - 14;
          if (y > 13) fy = y - 14;
          on =
            fx === 0 ||
            fx === 6 ||
            fy === 0 ||
            fy === 6 ||
            (fx > 1 && fx < 5 && fy > 1 && fy < 5);
        } else {
          seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
          on = (seed >> 8) % 2 === 0;
        }
        if (on) marks.push({ x, y });
      }
    }
    return marks;
  }, []);
  return (
    <svg
      viewBox="0 0 21 21"
      className="size-full"
      role="img"
      aria-label="Sample QR code"
    >
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="1"
          height="1"
          fill="#000"
        />
      ))}
    </svg>
  );
}

export function UpiPopup() {
  const db = usePgStore((state) => state.db);
  const user = usePgStore((state) => userById(state.db, state.uid));
  const tenant = tenantById(db, user?.tenantId);
  const closeModal = useUiStore((state) => state.closeModal);
  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (!tenant) return null;
  const amount = owed(db, tenant);
  const info = bedInfo(db, tenant.bedId);
  const link = `upi://pay?pa=${encodeURIComponent(db.settings.upi)}&pn=${encodeURIComponent(info.propertyName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Rent ${tenant.name}`)}`;
  return (
    <PopupFrame title="Pay rent by UPI">
      <div className="flex flex-col gap-3.5">
        <div className="text-center">
          <div className="text-sm text-[var(--muted)]">Amount</div>
          <div className="text-[34px] font-extrabold tracking-tight">
            {formatInr(amount)}
          </div>
        </div>
        <div className="mx-auto size-[168px] rounded-xl bg-white p-2">
          <SampleQr />
        </div>
        <div className="text-center text-sm">
          UPI ID: <b>{db.settings.upi}</b>
        </div>
        <a
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] text-sm font-bold"
          href={link}
        >
          Open my UPI app
        </a>
        <p className="text-sm text-[var(--muted)]">
          After paying, enter the 12-digit UTR from your UPI app. The owner
          confirms it and your receipt appears.
        </p>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          UTR / reference
          <Input
            value={utr}
            inputMode="numeric"
            maxLength={12}
            placeholder="12-digit UTR"
            onChange={(event) => setUtr(event.target.value)}
          />
        </label>
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
            const response = await ApiService.submitPaymentProof(utr);
            setLoading(false);
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          I have paid
        </RentoButton>
        <p className="text-xs text-[var(--muted)]">
          This QR is a sample and no real payment happens until the backend is
          connected.
        </p>
      </div>
    </PopupFrame>
  );
}

export function ComplaintPopup() {
  const closeModal = useUiStore((state) => state.closeModal);
  const setComplaintId = useUiStore((state) => state.setComplaintId);
  const router = useRouter();
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <PopupFrame title="Report a problem">
      <div className="flex flex-col gap-3.5">
        <div className="text-[13px] font-semibold text-[var(--muted)]">
          What is it about?
          <div className="mt-1.5 flex flex-wrap gap-2">
            {COMPLAINT_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={`h-11 rounded-full border px-3.5 text-sm font-semibold ${category === item ? "border-[var(--teal)] bg-[var(--teal)] text-white" : "border-[var(--line-strong)] bg-white"}`}
                onClick={() => {
                  setCategory(item);
                  if (item === "Roommate" || item === "Safety / urgent")
                    setIsPrivate(true);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Short title
          <Input
            value={title}
            placeholder="e.g. Tap leaking in bathroom"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Describe it
          <Textarea
            value={description}
            placeholder="What happened, since when?"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="text-[13px] font-semibold text-[var(--muted)]">
          Photos (up to 3)
          <label className="mt-1.5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm font-bold text-[var(--ink)]">
            <Camera className="size-4" /> Take or choose photo
            <input
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []).slice(
                  0,
                  3 - photos.length,
                );
                for (const file of files) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string")
                      setPhotos((current) =>
                        [...current, reader.result as string].slice(0, 3),
                      );
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <img
                key={photo.slice(0, 32)}
                src={photo}
                alt={`Selected photo ${index + 1}`}
                className="size-24 rounded-xl border border-[var(--line)] object-cover"
              />
            ))}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <Checkbox
            checked={isPrivate}
            onCheckedChange={(value) => setIsPrivate(value === true)}
          />
          Keep my name private from staff (owner only)
        </label>
        <label className="flex min-h-11 items-center gap-2.5 text-sm font-semibold">
          <Checkbox
            checked={urgent}
            onCheckedChange={(value) => setUrgent(value === true)}
          />
          This is urgent
        </label>
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
            const response = await ApiService.createComplaint({
              category,
              title,
              description,
              photos,
              isPrivate,
              urgent,
            });
            setLoading(false);
            if (response.status !== StatusCode.SuccessOK || !response.data) {
              setError(response.message);
              return;
            }
            setComplaintId(response.data.id);
            closeModal();
            router.push(AppRoutes.TenantHelp);
          }}
        >
          Submit complaint
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

export function PhotoPopup({ src, label }: { src: string; label: string }) {
  return (
    <PopupFrame title={label}>
      <img src={src} alt={label} className="w-full rounded-[14px]" />
    </PopupFrame>
  );
}

export function StaffPopup() {
  const db = usePgStore((state) => state.db);
  const closeModal = useUiStore((state) => state.closeModal);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState(db.properties[0]?.id ?? "");
  const [error, setError] = useState("");
  return (
    <PopupFrame title="Add staff">
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Name
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Email
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Property
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {db.properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={async () => {
            const response = await ApiService.addStaff({
              name,
              email,
              propertyId,
            });
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          Create staff login
        </RentoButton>
      </div>
    </PopupFrame>
  );
}

const emptySchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password needs 6+ characters"),
  pgName: z.string().min(2, "Enter the PG or hostel name"),
  area: z.string(),
});

type EmptyValues = z.infer<typeof emptySchema>;

export function NewPgPopup() {
  const router = useRouter();
  const closeModal = useUiStore((state) => state.closeModal);
  const form = useForm<EmptyValues>({
    resolver: zodResolver(emptySchema),
    defaultValues: { name: "", email: "", password: "", pgName: "", area: "" },
  });
  return (
    <PopupFrame title="Start with an empty PG">
      <Form {...form}>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={form.handleSubmit(async (values) => {
            const response = await ApiService.createEmptyPg(values);
            if (response.status !== StatusCode.SuccessOK) {
              form.setError("pgName", { message: response.message });
              return;
            }
            closeModal();
            router.replace(AppRoutes.Setup);
          })}
        >
          <p className="text-sm text-[var(--muted)]">
            Creates a fresh, empty account in this browser so you can set up
            your own floors, rooms and beds. Demo data is replaced.
          </p>
          {(["name", "email", "password", "pgName", "area"] as const).map(
            (name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {
                        {
                          name: "Your name",
                          email: "Email",
                          password: "Password",
                          pgName: "PG or hostel name",
                          area: "Locality",
                        }[name]
                      }
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={
                          name === "password"
                            ? "password"
                            : name === "email"
                              ? "email"
                              : "text"
                        }
                        placeholder={
                          {
                            name: "e.g. Suresh",
                            email: "you@example.com",
                            password: "At least 6 characters",
                            pgName: "e.g. Green Valley Hostel",
                            area: "e.g. Gachibowli",
                          }[name]
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ),
          )}
          <RentoButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={form.formState.isSubmitting}
          >
            Create and sign in
          </RentoButton>
        </form>
      </Form>
    </PopupFrame>
  );
}

export function PropertyPopup({ propertyId }: { propertyId?: string }) {
  const db = usePgStore((state) => state.db);
  const closeModal = useUiStore((state) => state.closeModal);
  const existing = db.properties.find((property) => property.id === propertyId);
  const [name, setName] = useState(existing?.name ?? "");
  const [area, setArea] = useState(existing?.area ?? "");
  const [bedStyle, setBedStyle] = useState<BedStyleEnum>(
    existing?.bedStyle ?? BedStyleEnum.alpha,
  );
  const [error, setError] = useState("");
  return (
    <PopupFrame title={existing ? "Edit property" : "Add property"}>
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Name
          <Input
            value={name}
            placeholder="e.g. Green Valley Hostel"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Locality
          <Input
            value={area}
            placeholder="e.g. Madhapur"
            onChange={(event) => setArea(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--muted)]">
          Bed labels
          <Select
            value={bedStyle}
            onValueChange={(value) => setBedStyle(value as BedStyleEnum)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BedStyleEnum.alpha}>A, B, C, D …</SelectItem>
              <SelectItem value={BedStyleEnum.num}>1, 2, 3, 4 …</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {error ? (
          <p className="text-[13px] font-semibold text-[var(--red)]">{error}</p>
        ) : null}
        <RentoButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={async () => {
            const response = existing
              ? await ApiService.updateProperty(existing.id, {
                  name,
                  area,
                  bedStyle,
                })
              : await ApiService.addProperty({ name, area, bedStyle });
            if (response.status !== StatusCode.SuccessOK) {
              setError(response.message);
              return;
            }
            closeModal();
          }}
        >
          {existing ? "Save" : "Add property"}
        </RentoButton>
      </div>
    </PopupFrame>
  );
}
