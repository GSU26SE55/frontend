export interface BatteryGroupDto {
  id:              string;
  siteId:          string;
  siteName:        string;
  name:            string;
  batteryTypeId:   string;
  batteryTypeName: string;
  batteryCount:    number;
  createdAt:       string;
}

export interface BatteryGroupListParams {
  pageNumber?:     number;
  pageSize?:       number;
  keyword?:        string;
  siteId?:         string;
  batteryTypeId?:  string;
  includeDeleted?: boolean;
}

export interface CreateBatteryGroupPayload {
  siteId:        string;
  name:          string;
  batteryTypeId: string;
}

export type UpdateBatteryGroupPayload = CreateBatteryGroupPayload;
