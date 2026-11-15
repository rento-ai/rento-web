export type BedLabelStyle = "alpha" | "numeric";

export interface CreatePropertyRequestModel {
  name: string;
  city: string;
  area?: string;
  address?: string;
  bed_label_style?: BedLabelStyle;
}

export type UpdatePropertyRequestModel = Partial<CreatePropertyRequestModel>;

export interface PropertyModel {
  id: string;
  organization_id: string;
  name: string;
  city: string;
  area: string | null;
  address: string | null;
  bed_label_style: BedLabelStyle;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
