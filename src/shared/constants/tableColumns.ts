// Tên cột table dùng chung (lặp ≥2 bảng). Cột đặc thù 1 bảng giữ tại chỗ.
// Dùng: <TableHead>{TABLE_COLUMNS.index}</TableHead>

export const TABLE_COLUMNS = {
  index: "STT",
  actions: "Thao tác",
  status: "Trạng thái",
  unit: "Đơn vị",
  ticket: "Ticket",
  time: "Thời gian",
  sla: "SLA",
  detectedAt: "Phát hiện lúc",
  source: "Nguồn",
  severity: "Mức độ",
  expiresAt: "Hết hạn",
  channel: "Channel",
  calibrated: "Calibrated",
} as const;
