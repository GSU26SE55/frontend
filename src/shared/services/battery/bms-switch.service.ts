import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  BmsSwitchCommandAcceptedDto,
  BmsSwitchStateDto,
  SetBmsSwitchPayload,
} from "@/shared/types/battery/bms-switch.types";

export const bmsSwitchService = {
  getState: (assetId: string) =>
    axiosInstance.get<CommonResponse<BmsSwitchStateDto>>(
      ENDPOINTS.BATTERY_ASSETS.BMS_SWITCH(assetId),
    ),
  setSwitch: (assetId: string, payload: SetBmsSwitchPayload) =>
    axiosInstance.post<CommonResponse<BmsSwitchCommandAcceptedDto>>(
      ENDPOINTS.BATTERY_ASSETS.BMS_SWITCH(assetId),
      payload,
    ),
};
