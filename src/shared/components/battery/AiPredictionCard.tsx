import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useSohPredictions,
  useAnomalyClassifications,
  useSubmitClassificationFeedback,
} from "@/shared/hooks/battery/useAiPredictions";
import {
  AnomalyClassificationEnum,
  AnomalyClassificationLabel,
  StaffFeedbackEnum,
  StaffFeedbackLabel,
} from "@/shared/enums/battery/ai.enum";

const chartConfig = {
  predictedSohPercent: { label: "SOH dự đoán (%)", color: "var(--chart-1)" },
} satisfies ChartConfig;

// Màu badge theo classification (Normal xanh, Degrading vàng, Failed đỏ).
function classificationVariant(
  c: AnomalyClassificationEnum,
): "default" | "secondary" | "destructive" {
  if (c === AnomalyClassificationEnum.Failed) return "destructive";
  if (c === AnomalyClassificationEnum.Degrading) return "secondary";
  return "default";
}

// Nút feedback hợp lệ theo phân loại của AI:
// - AI báo "Normal" → chỉ có thể "AI đúng" hoặc "Bỏ sót" (AI bỏ lọt bất thường).
// - AI báo "Degrading/Failed" → chỉ có thể "AI đúng" hoặc "Báo nhầm" (thực tế bình thường).
// "AI đúng" luôn có; "Báo nhầm"/"Bỏ sót" là 2 chiều sai loại trừ nhau.
function feedbackOptions(c: AnomalyClassificationEnum): StaffFeedbackEnum[] {
  if (c === AnomalyClassificationEnum.Normal) {
    return [StaffFeedbackEnum.Correct, StaffFeedbackEnum.FalseNegative];
  }
  return [StaffFeedbackEnum.Correct, StaffFeedbackEnum.FalsePositive];
}

export default function AiPredictionCard({ assetId }: { assetId: string }) {
  const { data: sohData, isLoading: sohLoading } = useSohPredictions({
    batteryAssetId: assetId,
    pageSize: 50,
  });
  const { data: clsData, isLoading: clsLoading } = useAnomalyClassifications({
    batteryAssetId: assetId,
    pageSize: 10,
  });
  const feedback = useSubmitClassificationFeedback();

  // Chart cần thứ tự tăng dần theo thời gian (BE trả DESC → đảo lại).
  const chartData = (sohData?.items ?? [])
    .slice()
    .reverse()
    .map((p) => ({
      time: new Date(p.predictedAt).toLocaleString("vi-VN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      predictedSohPercent: Number(p.predictedSohPercent),
    }));

  const latest = clsData?.items?.[0];

  return (
    <div className="space-y-4">
      {/* Trạng thái AI mới nhất */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Đánh giá AI mới nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {clsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : latest ? (
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant={classificationVariant(latest.classification)}>
                {AnomalyClassificationLabel[latest.classification]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Điểm bất thường: {Number(latest.anomalyScore).toFixed(3)}
              </span>
              <span className="text-sm text-muted-foreground">
                Độ tin cậy: {(Number(latest.confidence) * 100).toFixed(0)}%
              </span>
              <span className="text-sm text-muted-foreground">
                Model v{latest.modelVersion} · {latest.latencyMs}ms
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có kết quả AI cho pin này.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chart SOH dự đoán theo thời gian */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            SOH dự đoán theo thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sohLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu dự đoán. Job AI chạy mỗi 5 phút cho pin có đủ 30
              reading.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                  fontSize={11}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={32}
                />
                {/* Ngưỡng EOL 80% */}
                <ReferenceLine
                  y={80}
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  label={{
                    value: "EOL 80%",
                    position: "insideTopRight",
                    fontSize: 10,
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="predictedSohPercent"
                  type="monotone"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử phân loại + feedback */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lịch sử phân loại AI</CardTitle>
        </CardHeader>
        <CardContent>
          {clsLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : (clsData?.items?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có phân loại.</p>
          ) : (
            <div className="space-y-2">
              {clsData!.items.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={classificationVariant(c.classification)}>
                      {AnomalyClassificationLabel[c.classification]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.classifiedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {c.staffFeedback ? (
                    <span className="text-xs text-muted-foreground">
                      Đã đánh giá: {StaffFeedbackLabel[c.staffFeedback]}
                    </span>
                  ) : (
                    <div className="flex gap-1">
                      {feedbackOptions(c.classification).map((fb) => (
                        <button
                          key={fb}
                          type="button"
                          disabled={feedback.isPending}
                          onClick={() =>
                            feedback.mutate({ id: c.id, feedback: fb })
                          }
                          className="rounded border border-border px-2 py-0.5 text-xs hover:bg-accent disabled:opacity-50"
                        >
                          {StaffFeedbackLabel[fb]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
