import { useMemo, useState, useEffect, useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { animate } from "animejs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function formatDateTime(dateStr?: string | Date) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatChartTime(dateStr?: string | Date) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${time} ${date}`;
}

function getStatusTheme(c?: AnomalyClassificationEnum) {
  switch (c) {
    case AnomalyClassificationEnum.Failed:
      return {
        badgeVariant: "destructive" as const,
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        dotBg: "bg-rose-500",
        textAccent: "text-rose-600 dark:text-rose-400",
      };
    case AnomalyClassificationEnum.Degrading:
      return {
        badgeVariant: "secondary" as const,
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dotBg: "bg-amber-500",
        textAccent: "text-amber-600 dark:text-amber-400",
      };
    case AnomalyClassificationEnum.Normal:
    default:
      return {
        badgeVariant: "default" as const,
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dotBg: "bg-emerald-500",
        textAccent: "text-emerald-600 dark:text-emerald-400",
      };
  }
}

function feedbackOptions(c: AnomalyClassificationEnum): StaffFeedbackEnum[] {
  if (c === AnomalyClassificationEnum.Normal) {
    return [StaffFeedbackEnum.Correct, StaffFeedbackEnum.FalseNegative];
  }
  return [StaffFeedbackEnum.Correct, StaffFeedbackEnum.FalsePositive];
}

function getShortFeedbackLabel(fb: StaffFeedbackEnum): string {
  switch (fb) {
    case StaffFeedbackEnum.Correct:
      return "AI đúng";
    case StaffFeedbackEnum.FalsePositive:
      return "Báo nhầm";
    case StaffFeedbackEnum.FalseNegative:
      return "Bỏ sót";
    default:
      return StaffFeedbackLabel[fb];
  }
}

export default function AiPredictionCard({ assetId }: { assetId: string }) {
  const { data: sohData, isLoading: sohLoading } = useSohPredictions({
    batteryAssetId: assetId,
    pageSize: 50,
  });
  const { data: clsData, isLoading: clsLoading } = useAnomalyClassifications({
    batteryAssetId: assetId,
    pageSize: 50,
  });
  const feedback = useSubmitClassificationFeedback();

  const pulseRef = useRef<HTMLSpanElement>(null);

  const [clsSearch, setClsSearch] = useState("");
  const [clsFilter, setClsFilter] = useState<string>("all");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const clsFilterItems = [
    { value: "all", label: "Tất cả phân loại" },
    ...Object.values(AnomalyClassificationEnum).map((c) => ({
      value: String(c),
      label: AnomalyClassificationLabel[c],
    })),
  ];

  const filteredCls = useMemo(() => {
    const q = clsSearch.trim().toLowerCase();
    return (clsData?.items ?? []).filter((c) => {
      if (clsFilter !== "all" && String(c.classification) !== clsFilter)
        return false;
      if (!q) return true;
      const haystack = `${AnomalyClassificationLabel[c.classification]} ${formatDateTime(
        c.classifiedAt,
      )}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [clsData?.items, clsSearch, clsFilter]);

  const visibleCls = useMemo(() => {
    if (showAllHistory) return filteredCls;
    return filteredCls.slice(0, 6);
  }, [filteredCls, showAllHistory]);

  const chartData = useMemo(() => {
    return (sohData?.items ?? [])
      .slice()
      .reverse()
      .map((p) => ({
        time: formatChartTime(p.predictedAt),
        predictedSohPercent: Number(p.predictedSohPercent),
      }));
  }, [sohData?.items]);

  const latest = clsData?.items?.[0];
  const theme = getStatusTheme(latest?.classification);
  const latestSoh =
    chartData.length > 0
      ? chartData[chartData.length - 1].predictedSohPercent
      : null;

  useEffect(() => {
    if (pulseRef.current) {
      animate(pulseRef.current, {
        scale: [1, 1.4, 1],
        opacity: [0.9, 0.3, 0.9],
        easing: "easeInOutSine",
        duration: 2200,
        loop: true,
      });
    }
  }, [latest?.id]);

  return (
    <div className="space-y-4">
      {/* AI DIAGNOSTICS & SOH CHART CARD */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    ref={pulseRef}
                    className={`absolute inline-flex h-full w-full rounded-full ${theme.dotBg} opacity-75`}
                  />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.dotBg}`} />
                </span>
                <CardTitle className="text-base">Đánh giá AI</CardTitle>
              </div>

              {latest && (
                <Badge
                  variant={theme.badgeVariant}
                  className="text-xs font-medium shrink-0"
                >
                  {AnomalyClassificationLabel[latest.classification]}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {latestSoh !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 border border-border whitespace-nowrap">
                  <span>SOH:</span>
                  <strong className={latestSoh < 80 ? "text-destructive font-semibold" : "text-foreground font-semibold"}>
                    {latestSoh}%
                  </strong>
                </div>
              )}
              {latest && (
                <span className="whitespace-nowrap">
                  {formatDateTime(latest.classifiedAt)}
                </span>
              )}
            </div>
          </div>

          {/* 4 Thẻ Micro Stats (Đồng bộ font & border ứng dụng) */}
          {clsLoading ? (
            <p className="text-xs text-muted-foreground">Đang tải chẩn đoán AI…</p>
          ) : latest ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="rounded-lg border border-border bg-background px-3 py-2 space-y-0.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  Trạng thái
                </span>
                <span className={`font-medium text-sm ${theme.textAccent}`}>
                  {AnomalyClassificationLabel[latest.classification]}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-background px-3 py-2 space-y-0.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  Anomaly Score
                </span>
                <span className="font-medium text-sm text-foreground">
                  {Number(latest.anomalyScore).toFixed(3)}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-background px-3 py-2 space-y-0.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  Độ tin cậy
                </span>
                <span className="font-medium text-sm text-foreground">
                  {(Number(latest.confidence) * 100).toFixed(0)}%
                </span>
              </div>

              <div className="rounded-lg border border-border bg-background px-3 py-2 space-y-0.5">
                <span className="text-xs text-muted-foreground font-medium block">
                  Model
                </span>
                <span className="font-medium text-sm text-foreground">
                  v{latest.modelVersion} <span className="text-muted-foreground font-normal text-xs">({latest.latencyMs}ms)</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Chưa có kết quả chẩn đoán.</p>
          )}
        </CardHeader>

        {/* BIỂU ĐỒ SOH */}
        <CardContent className="pt-4">
          {sohLoading ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              Đang tải đồ thị SOH…
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
              Chưa có dữ liệu dự đoán SOH. Job AI chạy định kỳ 5 phút/lần.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sohSleekGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={35}
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={32}
                />
                <ReferenceLine
                  y={80}
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "EOL 80%",
                    position: "insideTopRight",
                    fontSize: 11,
                    fill: "var(--destructive)",
                    fontWeight: 600,
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="predictedSohPercent"
                  type="monotone"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#sohSleekGradient)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* LỊCH SỬ PHÂN LOẠI & THAO TÁC PHẢN HỒI */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Lịch sử phân loại AI</CardTitle>
              <span className="text-xs text-muted-foreground">
                ({filteredCls.length})
              </span>
            </div>

            {(clsData?.items?.length ?? 0) > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={clsSearch}
                  onChange={(e) => setClsSearch(e.target.value)}
                  placeholder="Tìm phân loại / thời gian…"
                  className="h-8.5 w-full sm:w-52 text-xs"
                />
                <Select
                  value={clsFilter}
                  onValueChange={(val) => setClsFilter(val ?? "all")}
                  items={clsFilterItems}
                >
                  <SelectTrigger className="h-8.5 w-40 text-xs">
                    <SelectValue placeholder="Tất cả phân loại" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {clsFilterItems.map((it) => (
                      <SelectItem key={it.value} value={it.value}>
                        {it.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          {clsLoading ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Đang tải lịch sử…</p>
          ) : (clsData?.items?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Chưa có phân loại nào.</p>
          ) : filteredCls.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Không có kết quả phù hợp.</p>
          ) : (
            <div className="space-y-3">
              <div className="divide-y divide-border">
                {visibleCls.map((c) => {
                  const itemTheme = getStatusTheme(c.classification);

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-xs hover:bg-muted/40 px-2 rounded transition-colors"
                    >
                      {/* Left info: Fixed width badge, score, timestamp */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-24 sm:w-28 shrink-0">
                          <Badge
                            variant={itemTheme.badgeVariant}
                            className="px-2 py-0.5 text-xs font-medium w-full justify-center text-center"
                          >
                            {AnomalyClassificationLabel[c.classification]}
                          </Badge>
                        </div>

                        <span className="text-muted-foreground text-xs w-24 sm:w-28 shrink-0">
                          Score: <strong className="text-foreground font-medium">{Number(c.anomalyScore).toFixed(3)}</strong>
                        </span>

                        <span className="text-muted-foreground text-xs truncate hidden sm:inline">
                          {formatDateTime(c.classifiedAt)}
                        </span>
                      </div>

                      {/* Right actions: Fixed width buttons aligned straight */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[155px]">
                        {c.staffFeedback ? (
                          <span className="inline-flex items-center justify-center text-xs font-medium px-3 py-1 rounded bg-muted/60 text-muted-foreground border border-border min-w-[155px] text-center">
                            ✓ {getShortFeedbackLabel(c.staffFeedback)}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end">
                            {feedbackOptions(c.classification).map((fb) => {
                              const isCorrect = fb === StaffFeedbackEnum.Correct;

                              return (
                                <button
                                  key={fb}
                                  type="button"
                                  disabled={feedback.isPending}
                                  title={StaffFeedbackLabel[fb]}
                                  onClick={() => feedback.mutate({ id: c.id, feedback: fb })}
                                  className={`w-[74px] justify-center text-center py-1 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
                                    isCorrect
                                      ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                  }`}
                                >
                                  {getShortFeedbackLabel(fb)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nut View All / Show Less */}
              {filteredCls.length > 6 && (
                <div className="text-center pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-xs text-primary font-medium hover:underline py-1"
                  >
                    {showAllHistory
                      ? "Thu gọn lịch sử"
                      : `Xem thêm ${filteredCls.length - 6} phân loại khác…`}
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
