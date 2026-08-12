import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  IotApiKeyScopeEnum,
  IOT_API_KEY_SCOPE_FLAGS,
  hasScope,
  toggleScope,
} from "@/shared/enums/iot/iot.enum";

const SCOPE_LABEL: Record<number, string> = {
  [IotApiKeyScopeEnum.SensorIngest]: "Sensor Ingest — push sensor readings",
  [IotApiKeyScopeEnum.DeviceHeartbeat]:
    "Device Heartbeat — provision + heartbeat",
  [IotApiKeyScopeEnum.EnvironmentalIngest]:
    "Environmental Ingest — environmental data",
  [IotApiKeyScopeEnum.FirmwareCheck]: "Firmware Check — OTA check",
};

interface Props {
  value: number; // current bitmask (default EdgeDeviceDefault = 15 — GH-785)
  onChange: (value: number) => void;
}

// Render a checkbox per atomic flag; the combination is stored as a single bitmask number.
export default function ApiKeyScopesField({ value, onChange }: Props) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      {IOT_API_KEY_SCOPE_FLAGS.map((flag) => {
        const id = `scope-${flag}`;
        return (
          <div key={flag} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={hasScope(value, flag)}
              onCheckedChange={() => onChange(toggleScope(value, flag))}
            />
            <Label htmlFor={id} className="text-sm font-normal">
              {SCOPE_LABEL[flag]}
            </Label>
          </div>
        );
      })}
      <button
        type="button"
        className="text-xs text-muted-foreground underline"
        onClick={() => onChange(IotApiKeyScopeEnum.EdgeDeviceDefault)}
      >
        Reset to default (EdgeDeviceDefault)
      </button>
    </div>
  );
}
