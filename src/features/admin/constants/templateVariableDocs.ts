/**
 * Từ điển tên biến template → mô tả + giá trị mẫu.
 *
 * Vì sao cần: endpoint `/variables` của BE (NotificationTemplateVariables.cs) chỉ trả về **tên
 * khoá** — `["ticketId", "code", "customerId", "priority", "screen"]`. Người soạn template nhìn
 * dãy chip `{{code}}` `{{screen}}` không đoán được cái nào là mã ticket hiển thị cho khách, cái
 * nào là GUID nội bộ, cái nào là đường dẫn deep-link. Handlebars lại render biến sai thành chuỗi
 * rỗng chứ không báo lỗi, nên đoán sai thì phải tới lúc khách nhận thông báo mới lộ.
 *
 * Bảng này tra theo tên khoá, **không phân biệt hoa thường** (BE dựng model bằng
 * OrdinalIgnoreCase nên `{{Code}}` và `{{code}}` đều chạy).
 *
 * Khi consumer BE thêm khoá payload mới: thêm một dòng ở đây. Thiếu dòng cũng không vỡ gì —
 * chip vẫn hiện, chỉ là không có mô tả.
 */

export interface TemplateVariableDoc {
  /** Nhãn ngắn tiếng Việt — hiện cạnh tên biến. */
  label: string;
  /** Giá trị thật sẽ được thay vào lúc gửi — giúp hình dung câu văn ra sao. */
  sample: string;
  /**
   * Biến nên tránh dùng trong nội dung gửi cho người nhận: GUID nội bộ hoặc số enum trần.
   * Vẫn cho chèn (có trường hợp cần), chỉ cảnh báo nhẹ.
   */
  internal?: boolean;
}

export const TEMPLATE_VARIABLE_DOCS: Record<string, TemplateVariableDoc> = {
  // ── Biến chung (builtin — mọi type đều có) ────────────────────────────────
  title: { label: "Tiêu đề hệ thống tự sinh", sample: "Ticket mới TK-1042" },
  body: {
    label: "Nội dung hệ thống tự sinh",
    sample: "Ticket TK-1042 vừa được tạo",
  },
  entitytype: { label: "Loại đối tượng liên quan", sample: "Ticket" },
  entityid: {
    label: "ID đối tượng liên quan",
    sample: "3f2b…c19a",
    internal: true,
  },
  userid: { label: "ID người nhận", sample: "8a71…40de", internal: true },
  createdat: { label: "Thời điểm tạo thông báo", sample: "17/08/2026 09:15" },

  // ── Ticket ───────────────────────────────────────────────────────────────
  ticketid: { label: "ID ticket", sample: "3f2b…c19a", internal: true },
  code: { label: "Mã ticket hiển thị", sample: "TK-1042" },
  ticketcode: { label: "Mã ticket hiển thị", sample: "TK-1042" },
  customerid: { label: "ID khách hàng", sample: "9c14…77bf", internal: true },
  staffid: { label: "ID kỹ thuật viên", sample: "5e08…2a31", internal: true },
  staffname: { label: "Tên kỹ thuật viên", sample: "Nguyễn Văn A" },
  priority: { label: "Mức ưu tiên (số)", sample: "1", internal: true },
  screen: {
    label: "Màn hình mở khi bấm vào thông báo",
    sample: "ticket-detail",
  },
  resolvedbystaffid: {
    label: "ID kỹ thuật viên xử lý xong",
    sample: "5e08…2a31",
    internal: true,
  },
  sourceticketid: {
    label: "ID ticket bị gộp",
    sample: "3f2b…c19a",
    internal: true,
  },
  masterticketid: {
    label: "ID ticket giữ lại sau gộp",
    sample: "7d90…11cc",
    internal: true,
  },
  declaredbyuserid: {
    label: "ID người khai báo sự cố",
    sample: "8a71…40de",
    internal: true,
  },

  // Trạng thái — luôn ưu tiên cặp *StatusName thay vì số trần.
  oldstatus: { label: "Trạng thái cũ (số)", sample: "3", internal: true },
  newstatus: { label: "Trạng thái mới (số)", sample: "4", internal: true },
  oldstatusname: { label: "Trạng thái cũ", sample: "Đang xử lý" },
  newstatusname: { label: "Trạng thái mới", sample: "Đã xử lý" },

  // Lịch hẹn / tiến độ
  scheduledstartatutc: { label: "Giờ hẹn bắt đầu", sample: "18/08/2026 08:00" },
  previousscheduledstartatutc: {
    label: "Giờ hẹn trước khi đổi",
    sample: "17/08/2026 14:00",
  },
  workstartsimmediately: { label: "Bắt đầu làm ngay?", sample: "true" },
  startedatutc: { label: "Giờ bắt đầu làm", sample: "18/08/2026 08:05" },
  scheduleversion: { label: "Lần đổi lịch thứ mấy", sample: "2" },
  activationreason: { label: "Lý do kích hoạt", sample: "ScheduleReached" },
  closedat: { label: "Thời điểm đóng ticket", sample: "19/08/2026 17:30" },
  isautoclosed: { label: "Tự động đóng?", sample: "true" },
  rating: { label: "Số sao khách đánh giá", sample: "5" },
  approvedat: { label: "Thời điểm duyệt", sample: "19/08/2026 10:00" },
  rejectedat: { label: "Thời điểm từ chối", sample: "19/08/2026 10:00" },
  isclosedrejected: { label: "Từ chối kèm đóng ticket?", sample: "false" },
  reason: { label: "Lý do", sample: "Ngoài phạm vi bảo hành" },
  note: { label: "Ghi chú thêm", sample: "Khách yêu cầu khảo sát lại" },
  reopenreason: { label: "Lý do mở lại", sample: "Sự cố tái diễn" },
  reopencount: { label: "Số lần mở lại", sample: "2" },
  reopenedat: { label: "Thời điểm mở lại", sample: "20/08/2026 09:00" },
  dayspending: { label: "Số ngày chờ", sample: "3" },
  daysuntilratingdeadline: { label: "Số ngày còn để đánh giá", sample: "4" },

  // ── SLA ──────────────────────────────────────────────────────────────────
  percentage: { label: "Phần trăm SLA đã dùng", sample: "80" },
  warningat: { label: "Thời điểm cảnh báo", sample: "18/08/2026 12:00" },
  breachedat: { label: "Thời điểm vi phạm SLA", sample: "18/08/2026 16:00" },
  resumedat: { label: "Thời điểm chạy lại SLA", sample: "18/08/2026 13:00" },
  prioritytier: { label: "Bậc ưu tiên", sample: "P1" },

  // ── Pin / cảnh báo ───────────────────────────────────────────────────────
  alertid: { label: "ID cảnh báo", sample: "b2e4…9017", internal: true },
  batteryassetid: { label: "ID pin", sample: "c5a3…88f2", internal: true },
  assetserialnumber: { label: "Số serial pin", sample: "BAT-2024-0917" },
  anomalytype: { label: "Loại bất thường (số)", sample: "4", internal: true },
  severity: { label: "Mức nghiêm trọng (số)", sample: "3", internal: true },
  anomalytypename: { label: "Loại bất thường", sample: "Quá nhiệt" },
  severityname: { label: "Mức nghiêm trọng", sample: "Nghiêm trọng" },
  actualvalue: { label: "Giá trị đo được", sample: "62.4" },
  thresholdvalue: { label: "Ngưỡng cho phép", sample: "55.0" },
  unit: { label: "Đơn vị đo", sample: "°C" },
  detectedat: { label: "Thời điểm phát hiện", sample: "17/08/2026 09:12" },
  minutessincedetection: { label: "Số phút kể từ khi phát hiện", sample: "45" },
  cascaderiskscore: { label: "Điểm rủi ro lan truyền", sample: "0.82" },
  relatedticketid: {
    label: "ID ticket liên quan",
    sample: "3f2b…c19a",
    internal: true,
  },
  correlationid: {
    label: "ID lần chạy (tra log)",
    sample: "a19f…5c30",
    internal: true,
  },
  errorcode: { label: "Mã lỗi", sample: "SAGA_TIMEOUT" },
  failedat: { label: "Thời điểm thất bại", sample: "17/08/2026 09:20" },
  failedatstage: { label: "Thất bại ở bước nào", sample: "CreateTicket" },

  // ── Site / môi trường ────────────────────────────────────────────────────
  incidentid: { label: "ID sự cố", sample: "d7c1…4e60", internal: true },
  siteid: { label: "ID trạm", sample: "e3f8…2b47", internal: true },
  sitename: { label: "Tên trạm", sample: "Trạm Bình Dương 1" },
  incidenttype: { label: "Loại sự cố", sample: "Nhiệt độ cao" },
  description: { label: "Mô tả sự cố", sample: "Nhiệt độ phòng vượt 45°C" },
  wasfalsealarm: { label: "Báo động giả?", sample: "false" },
  resolvedat: { label: "Thời điểm khắc phục xong", sample: "17/08/2026 11:40" },

  // ── IoT ──────────────────────────────────────────────────────────────────
  iotdeviceid: {
    label: "ID thiết bị IoT",
    sample: "f4a2…6d18",
    internal: true,
  },
  devicecode: { label: "Mã thiết bị IoT", sample: "IOT-BD1-07" },
  lastseenat: { label: "Lần cuối online", sample: "17/08/2026 08:50" },
  offlinedurationseconds: { label: "Số giây mất kết nối", sample: "900" },
  affectedbatterycount: { label: "Số pin bị ảnh hưởng", sample: "12" },
  recoveredat: { label: "Thời điểm khôi phục", sample: "17/08/2026 09:05" },
  lastofflineat: {
    label: "Lần mất kết nối gần nhất",
    sample: "17/08/2026 08:50",
  },
  rejectedreadingcount: { label: "Số bản ghi bị loại", sample: "148" },
  windowstartedat: {
    label: "Bắt đầu cửa sổ theo dõi",
    sample: "17/08/2026 06:00",
  },
  decommissionedat: {
    label: "Thời điểm ngừng dùng",
    sample: "17/08/2026 09:30",
  },

  // ── Trao đổi (chat) ──────────────────────────────────────────────────────
  chatid: { label: "ID cuộc trao đổi", sample: "aa10…39fe", internal: true },
  sendername: { label: "Tên người gửi", sample: "Trần Thị B" },
  isinternal: { label: "Là ghi chú nội bộ?", sample: "false" },
  isgroupmention: { label: "Nhắc cả nhóm?", sample: "true" },
  reactiontype: { label: "Loại biểu cảm", sample: "Like" },
  managuserid: { label: "ID quản lý", sample: "6b22…f803", internal: true },
  manageruserid: { label: "ID quản lý", sample: "6b22…f803", internal: true },
  oldtype: { label: "Vai trò cũ", sample: "Observer" },
  newtype: { label: "Vai trò mới", sample: "Assignee" },

  // ── Tài khoản ────────────────────────────────────────────────────────────
  accountid: { label: "ID tài khoản", sample: "8a71…40de", internal: true },
  creationsource: { label: "Nguồn tạo tài khoản", sample: "AdminInvite" },
  role: { label: "Vai trò", sample: "Staff" },

  // ── Blog ─────────────────────────────────────────────────────────────────
  blogpostid: { label: "ID bài viết", sample: "cc39…7a44", internal: true },
  errormessage: {
    label: "Lỗi kỹ thuật gốc",
    sample: "Timeout after 60s",
    internal: true,
  },

  // ── Bản tin gom (digest) ─────────────────────────────────────────────────
  digest: { label: "Là bản tin gom?", sample: "true" },
  count: { label: "Số thông báo được gom", sample: "7" },
  from: { label: "Từ thời điểm", sample: "17/08/2026 08:00" },
  to: { label: "Đến thời điểm", sample: "17/08/2026 12:00" },
  notificationids: {
    label: "Danh sách ID thông báo",
    sample: "3 ID…",
    internal: true,
  },
};

/** Tra mô tả của một biến — không phân biệt hoa thường. `undefined` nếu chưa khai. */
export function getVariableDoc(name: string): TemplateVariableDoc | undefined {
  return TEMPLATE_VARIABLE_DOCS[name.toLowerCase()];
}
