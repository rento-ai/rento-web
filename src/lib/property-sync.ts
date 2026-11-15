import { BedStyleEnum } from "@/enums/pg.enum";
import { StatusCode } from "@/enums/status-code.enum";
import type { PropertyModel as ApiPropertyModel } from "@/models/property.model";
import ApiService from "@/services/api.service";
import usePgStore from "@/store/usePg.store";

function mapApiProperty(
  item: ApiPropertyModel,
  floors: { key: string; label: string }[] = [],
) {
  return {
    id: item.id,
    name: item.name,
    area: item.area?.trim() || item.city,
    bedStyle:
      item.bed_label_style === "alpha" ? BedStyleEnum.alpha : BedStyleEnum.num,
    floors,
  };
}

/** Accepts a property object or a one-item array from the API. */
export function normalizeApiProperty(data: unknown): ApiPropertyModel | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const property = row as Partial<ApiPropertyModel>;
  if (typeof property.id !== "string" || typeof property.name !== "string") {
    return null;
  }
  return {
    id: property.id,
    organization_id: property.organization_id ?? "",
    name: property.name,
    city: property.city ?? "",
    area: property.area ?? null,
    address: property.address ?? null,
    bed_label_style: property.bed_label_style === "alpha" ? "alpha" : "numeric",
    is_active: property.is_active ?? true,
    created_at: property.created_at ?? "",
    updated_at: property.updated_at ?? "",
  };
}

export function syncPropertiesToStore(apiProperties: ApiPropertyModel[]) {
  usePgStore.setState((state) => {
    const previous = new Map(
      state.db.properties.map((property) => [property.id, property]),
    );
    const properties = apiProperties.map((item) =>
      mapApiProperty(item, previous.get(item.id)?.floors ?? []),
    );
    const stillSelected =
      state.setupPropertyId &&
      properties.some((property) => property.id === state.setupPropertyId);

    return {
      db: {
        ...state.db,
        properties,
      },
      setupPropertyId: stillSelected
        ? state.setupPropertyId
        : (properties[0]?.id ?? null),
    };
  });
}

export function syncPropertyToStore(apiProperty: ApiPropertyModel) {
  usePgStore.setState((state) => {
    const previous = state.db.properties.find(
      (property) => property.id === apiProperty.id,
    );
    const mapped = mapApiProperty(apiProperty, previous?.floors ?? []);
    const properties = previous
      ? state.db.properties.map((property) =>
          property.id === mapped.id ? mapped : property,
        )
      : [...state.db.properties, mapped];

    return {
      db: {
        ...state.db,
        properties,
      },
      setupPropertyId: state.setupPropertyId ?? mapped.id,
    };
  });
}

export async function refreshProperties(showLoader = false) {
  const response = await ApiService.getProperties(showLoader);
  if (
    (response.status === StatusCode.SuccessOK ||
      response.status === StatusCode.SuccessCreated) &&
    response.data
  ) {
    syncPropertiesToStore(response.data);
  }
  return response;
}
