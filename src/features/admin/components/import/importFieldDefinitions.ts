import { ImportEntityTypeEnum } from "@/shared/enums/import/import.enum";

/**
 * One editable column of a row-correction form.
 *
 * Mirrors `TemplateColumns`/`RequiredColumns` in the BE's `CsvImportFileParser` — same column
 * keys, same order, same required set. Kept in its own file for the same fast-refresh reason as
 * `importLabels.ts`.
 */
export interface ImportFieldDefinition {
  key: string;
  label: string;
  required: boolean;
}

/**
 * BE error `Field` names (PascalCase, from `ImportRowValidator`/`CreateImportBatchCommandHandler`)
 * mapped to the snake_case column key the edit form uses — lets the UI highlight exactly the input
 * an error message is about instead of just listing the raw error text.
 */
export const IMPORT_ERROR_FIELD_TO_COLUMN_KEY: Record<string, string> = {
  ExternalCustomerCode: "external_customer_code",
  FullName: "full_name",
  Email: "email",
  Phone: "phone",
  ExternalSiteCode: "external_site_code",
  SiteName: "site_name",
  Address: "address",
  Latitude: "latitude",
  Longitude: "longitude",
  InstallDate: "install_date",
  ContactPersonName: "contact_person_name",
  ContactPersonPhone: "contact_person_phone",
  ExternalAssetCode: "external_asset_code",
  SerialNumber: "serial_number",
  BatteryTypeName: "battery_type_name",
  Manufacturer: "manufacturer",
  NominalCapacityAh: "nominal_capacity_ah",
  NominalVoltage: "nominal_voltage",
  Chemistry: "chemistry",
  WarrantyEndDate: "warranty_end_date",
  Location: "location",
  Notes: "notes",
};

/** "ExternalRef" (the duplicate-code error) always names the row's own identity column. */
export const IMPORT_IDENTITY_FIELD_KEY: Record<ImportEntityTypeEnum, string> = {
  [ImportEntityTypeEnum.Customer]: "external_customer_code",
  [ImportEntityTypeEnum.Site]: "external_site_code",
  [ImportEntityTypeEnum.BatteryAsset]: "external_asset_code",
};

export function errorColumnKey(
  entityType: ImportEntityTypeEnum,
  errorField: string,
): string | null {
  if (errorField === "ExternalRef") return IMPORT_IDENTITY_FIELD_KEY[entityType];
  return IMPORT_ERROR_FIELD_TO_COLUMN_KEY[errorField] ?? null;
}

export const IMPORT_FIELD_DEFINITIONS: Record<
  ImportEntityTypeEnum,
  ImportFieldDefinition[]
> = {
  [ImportEntityTypeEnum.Customer]: [
    { key: "external_customer_code", label: "Customer code", required: true },
    { key: "full_name", label: "Full name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone", label: "Phone", required: false },
  ],
  [ImportEntityTypeEnum.Site]: [
    { key: "external_site_code", label: "Site code", required: true },
    { key: "external_customer_code", label: "Customer code", required: true },
    { key: "site_name", label: "Site name", required: true },
    { key: "address", label: "Address", required: false },
    { key: "latitude", label: "Latitude", required: false },
    { key: "longitude", label: "Longitude", required: false },
    { key: "install_date", label: "Install date", required: false },
    { key: "contact_person_name", label: "Contact name", required: false },
    { key: "contact_person_phone", label: "Contact phone", required: false },
  ],
  [ImportEntityTypeEnum.BatteryAsset]: [
    { key: "external_asset_code", label: "Asset code", required: true },
    { key: "external_site_code", label: "Site code", required: true },
    { key: "serial_number", label: "Serial number", required: true },
    { key: "battery_type_name", label: "Battery type", required: true },
    { key: "manufacturer", label: "Manufacturer", required: false },
    { key: "nominal_capacity_ah", label: "Capacity (Ah)", required: false },
    { key: "nominal_voltage", label: "Voltage (V)", required: false },
    { key: "chemistry", label: "Chemistry", required: false },
    { key: "install_date", label: "Install date", required: false },
    { key: "warranty_end_date", label: "Warranty end date", required: false },
    { key: "location", label: "Location", required: false },
    { key: "notes", label: "Notes", required: false },
  ],
};
