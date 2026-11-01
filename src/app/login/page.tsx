"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppRoutes } from "@/components/app-routes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { Input } from "@/components/input";
import { ModalHost } from "@/components/popups/modal-host";
import { RentoButton } from "@/components/rento-button";
import { RoleEnum } from "@/enums/role.enum";
import { StatusCode } from "@/enums/status-code.enum";
import {
  BRAND_NAME,
  DEMO_PASSWORD,
  DEMO_TODAY,
  formatFullDate,
} from "@/lib/constants";
import { userById } from "@/lib/pg";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";
import useUiStore from "@/store/useUi.store";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const demos = [
  { label: "Owner", hint: "Full access", email: "raju@demo.in" },
  { label: "Staff", hint: "Limited access", email: "anita@demo.in" },
  { label: "Tenant", hint: "Student view", email: "karthik@demo.in" },
];

export default function LoginPage() {
  const router = useRouter();
  const hydrated = usePgStore((state) => state.hydrated);
  const openModal = useUiStore((state) => state.openModal);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!hydrated) return;
    const user = userById(usePgStore.getState().db, usePgStore.getState().uid);
    if (!user) return;
    router.replace(
      user.role === RoleEnum.tenant
        ? AppRoutes.TenantHome
        : AppRoutes.Dashboard,
    );
  }, [hydrated, router]);

  const onSubmit = async (values: FormValues) => {
    const response = await ApiService.login(values.email, values.password);
    if (response.status !== StatusCode.SuccessOK || !response.data) {
      form.setError("password", { message: response.message });
      return;
    }
    router.replace(
      response.data.role === RoleEnum.tenant
        ? AppRoutes.TenantHome
        : AppRoutes.Dashboard,
    );
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-between gap-8 bg-[var(--teal-deep)] p-7 text-white lg:p-12">
        <div className="flex items-center gap-3 text-lg font-extrabold">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[var(--saffron)] text-[var(--teal-deep)]">
            <LayoutDashboard className="size-5" />
          </span>
          {BRAND_NAME}
        </div>
        <div>
          <h1 className="max-w-[460px] text-3xl leading-tight font-extrabold tracking-tight lg:text-[40px]">
            Run your PG without chasing rent.
          </h1>
          <p className="mt-3.5 max-w-[440px] text-[#B7D3CE]">
            Beds, tenants, rent, deposits and complaints in one place. This
            frontend runs on sample data in your browser until the backend is
            connected.
          </p>
        </div>
        <div className="text-sm text-[#B7D3CE]">
          Demo date: {formatFullDate(DEMO_TODAY)}
        </div>
      </section>
      <section className="flex items-center justify-center p-7 lg:p-12">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full max-w-[400px] flex-col gap-4"
            autoComplete="off"
          >
            <div>
              <h2 className="text-[26px] font-extrabold tracking-tight">
                Sign in
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pick a demo account or type the credentials.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demos.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  className="flex min-h-16 flex-col rounded-xl border border-[var(--line-strong)] bg-white px-2.5 py-2.5 text-left text-sm font-bold"
                  onClick={() => {
                    form.setValue("email", demo.email);
                    form.setValue("password", DEMO_PASSWORD);
                  }}
                >
                  {demo.label}
                  <small className="text-xs font-medium text-[var(--muted)]">
                    {demo.hint}
                  </small>
                </button>
              ))}
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="raju@demo.in" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={DEMO_PASSWORD}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <RentoButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={form.formState.isSubmitting}
            >
              Sign in
            </RentoButton>
            <p className="text-xs text-[var(--muted)]">
              All demo passwords are <b>{DEMO_PASSWORD}</b>. New tenants you
              check in can sign in with the email you enter.
            </p>
            <div className="flex flex-wrap gap-2">
              <RentoButton
                type="button"
                size="sm"
                onClick={() => openModal({ type: "new-pg" })}
              >
                Start with an empty PG
              </RentoButton>
              <RentoButton
                type="button"
                size="sm"
                onClick={() => ApiService.resetDemo()}
              >
                Reset demo data
              </RentoButton>
            </div>
          </form>
        </Form>
      </section>
      <ModalHost />
    </div>
  );
}
