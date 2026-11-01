import axios, { AxiosError, isCancel } from "axios";
import { config } from "@/config";
import { ApiMethodsEnum } from "@/enums/api-methods.enum";
import { StatusCode } from "@/enums/status-code.enum";
import type { ApiResponseModel } from "@/models/api-response.model";
import { ToastService } from "@/services/toast.service";
import useLoaderStore from "@/store/useLoader.store";

type FetchApiOptions = {
  signal?: AbortSignal;
  silent?: boolean;
};

const aborted = <T>(): ApiResponseModel<T> => ({
  status: 0,
  message: "",
  data: null,
  errors: [],
});

const fetchApi = async <T = unknown>(
  url: string,
  data: unknown = {},
  method = ApiMethodsEnum.post,
  showLoader = false,
  timeout = 600000,
  options?: FetchApiOptions,
): Promise<ApiResponseModel<T>> => {
  if (!config.NEXT_PUBLIC_BACKEND_HOST) {
    return {
      status: StatusCode.ServerError,
      message: "Backend is not connected",
      data: null,
      errors: [],
    };
  }

  const { setIsLoading } = useLoaderStore.getState();
  try {
    if (options?.signal?.aborted) return aborted<T>();
    if (showLoader) setIsLoading(true);
    const response = await axios({
      method,
      url: `${config.NEXT_PUBLIC_BACKEND_HOST}/${url}`,
      data,
      withCredentials: true,
      timeout,
      signal: options?.signal,
    });
    if (!options?.silent) ToastService.showSuccess(response.data?.message);
    return response.data as ApiResponseModel<T>;
  } catch (error: unknown) {
    if (
      options?.signal?.aborted ||
      isCancel(error) ||
      (error instanceof AxiosError && error.code === AxiosError.ERR_CANCELED)
    ) {
      return aborted<T>();
    }
    if (error instanceof AxiosError) {
      const body = error.response?.data as ApiResponseModel<T> | undefined;
      if (body?.status === StatusCode.ClientErrorUnauthorized) {
        return body;
      }
      if (!options?.silent && body?.message)
        ToastService.showFailure(body.message);
      if (body) return body;
    }
    return {
      status: StatusCode.ServerError,
      message: "Network error",
      data: null,
      errors: [],
    };
  } finally {
    if (showLoader) setIsLoading(false);
  }
};

export default fetchApi;
