import { ApiMethodsEnum } from "@/enums/api-methods.enum";
import type { ApiResponseModel } from "@/models/api-response.model";
import type {
  LoginRequestModel,
  RegisterOwnerRequestModel,
  RegisterOwnerResponseModel,
  UserModel,
} from "@/models/user.model";
import fetchApi from "@/services/api-handler";

export default class ApiService {
  static login(
    data: LoginRequestModel,
    showLoader = false,
  ): Promise<ApiResponseModel<UserModel>> {
    return fetchApi<UserModel>(
      "auth/login",
      data,
      ApiMethodsEnum.post,
      showLoader,
    );
  }
  static logout(): Promise<ApiResponseModel<void>> {
    return fetchApi("auth/logout", {});
  }
  static registerOwner(
    data: RegisterOwnerRequestModel,
  ): Promise<ApiResponseModel<RegisterOwnerResponseModel>> {
    return fetchApi<RegisterOwnerResponseModel>(
      "auth/register-owner",
      data,
      ApiMethodsEnum.post,
    );
  }
}
