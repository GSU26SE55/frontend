import { ImportEntityTypeEnum } from "@/shared/enums/import/import.enum";

/**
 * Display labels for each import entity type.
 *
 * Kept in its own file rather than beside the component: the project's fast-refresh rule requires
 * a component file to export only components. Exporting a constant alongside one forces a full
 * page reload instead of an in-place update on every edit.
 */
export const IMPORT_ENTITY_LABEL: Record<ImportEntityTypeEnum, string> = {
  [ImportEntityTypeEnum.Customer]: "Customer",
  [ImportEntityTypeEnum.Site]: "Site",
  [ImportEntityTypeEnum.BatteryAsset]: "Battery asset",
};
