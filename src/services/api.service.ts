import { ApiMethodsEnum } from "@/enums/api-methods.enum";
import type { ApiResponseModel } from "@/models/api-response.model";
import type {
  CreatePropertyRequestModel,
  PropertyModel,
  UpdatePropertyRequestModel,
} from "@/models/property.model";
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
  static createProperty(
    data: CreatePropertyRequestModel,
    showLoader = false,
  ): Promise<ApiResponseModel<PropertyModel>> {
    return fetchApi<PropertyModel>(
      "properties",
      data,
      ApiMethodsEnum.post,
      showLoader,
    );
  }
  static getProperties(
    showLoader = false,
  ): Promise<ApiResponseModel<PropertyModel[]>> {
    return fetchApi<PropertyModel[]>(
      "properties",
      {},
      ApiMethodsEnum.get,
      showLoader,
      600000,
      { silent: true },
    );
  }
  static getProperty(
    id: string,
    showLoader = false,
  ): Promise<ApiResponseModel<PropertyModel>> {
    return fetchApi<PropertyModel>(
      `properties/${id}`,
      {},
      ApiMethodsEnum.get,
      showLoader,
      600000,
      { silent: true },
    );
  }
  static updateProperty(
    id: string,
    data: UpdatePropertyRequestModel,
    showLoader = false,
  ): Promise<ApiResponseModel<PropertyModel>> {
    return fetchApi<PropertyModel>(
      `properties/${id}`,
      data,
      ApiMethodsEnum.patch,
      showLoader,
    );
  }
}
