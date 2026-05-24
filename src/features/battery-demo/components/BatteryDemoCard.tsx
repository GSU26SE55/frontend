import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BatteryDemo } from "@/features/battery-demo/types/battery-demo.types";

interface BatteryDemoCardProps {
  battery: BatteryDemo;
  selected: boolean;
  onClick: () => void;
}

export default function BatteryDemoCard({
  battery,
  selected,
  onClick,
}: BatteryDemoCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all ${selected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{battery.name}</CardTitle>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {battery.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{battery.serialNumber}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">SOH</span>
          <span className="font-semibold">{battery.soh}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${battery.soh}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {battery.location}
        </p>
      </CardContent>
    </Card>
  );
}
