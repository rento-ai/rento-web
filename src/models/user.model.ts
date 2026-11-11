import type { RoleEnum } from "@/enums/role.enum";

export interface LoginRequestModel {
  email: string;
  password: string;
}

export interface UserModel {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: RoleEnum;
  must_change_password: boolean;
}

export interface RegisterOwnerRequestModel {
  organizationName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
}

export interface OrganizationModel {
  id: string;
  name: string;
}

export interface OwnerModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleEnum;
}

export interface RegisterOwnerResponseModel {
  organization: OrganizationModel;
  owner: OwnerModel;
}
