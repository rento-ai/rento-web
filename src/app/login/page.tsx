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
import { RentoButton } from "@/components/rento-button";
import { RoleEnum } from "@/enums/role.enum";
import { StatusCode } from "@/enums/status-code.enum";
import { BRAND_NAME } from "@/lib/constants";
import ApiService from "@/services/api.service";
import useUserStore from "@/store/useUser.store";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useUserStore((state) => state.hydrated);
  const user = useUserStore((state) => state.user);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!hydrated || !user) return;
    router.replace(
      user.role === RoleEnum.tenant
        ? AppRoutes.TenantHome
        : AppRoutes.Dashboard,
    );
  }, [hydrated, user, router]);

  const onSubmit = async (values: FormValues) => {
    const response = await ApiService.login(
      {
        email: values.email,
        password: values.password,
      },
      true,
    );
    if (response.status !== StatusCode.SuccessOK || !response.data) {
      form.setError("password", {
        message: response.message || "Invalid email or password",
      });
      return;
    }
    useUserStore.getState().setUser(response.data);
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
            Beds, tenants, rent, deposits and complaints in one place.
          </p>
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
                Enter your email and password to continue.
              </p>
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
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
                      placeholder="Your password"
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
          </form>
        </Form>
      </section>
    </div>
  );
}
