import { toast } from "sonner";

export const ToastService = {
  showSuccess: (message?: string) => {
    if (message) toast.success(message);
  },
  showFailure: (message?: string) => {
    if (message) toast.error(message);
  },
};
