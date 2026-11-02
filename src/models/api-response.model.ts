export interface ApiErrorModel {
  message: string;
}

export interface ApiResponseModel<T = unknown> {
  status: number;
  message: string;
  data: T | null;
  errors: ApiErrorModel[];
}
