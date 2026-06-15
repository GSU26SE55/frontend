import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";
import { KbReferenceTypeEnum } from "@/shared/enums/kb.enum";
import type {
  KbArticleDTO,
  KbArticleSummaryDTO,
  TicketKbReferenceDTO,
} from "@/shared/types/kb.types";

// TODO: Remove this file when BE KB API is ready

export const MOCK_KB_ARTICLES: KbArticleDTO[] = [
  {
    id: "kb-001",
    code: "KB-0001",
    category: 1,
    title: "Xử lý pin lithium-ion quá nhiệt khi sạc",
    symptoms:
      "Pin nóng bất thường (>45°C) trong quá trình sạc.\nĐèn cảnh báo nhấp nháy đỏ.\nTốc độ sạc giảm đáng kể.",
    diagnosisSteps:
      "1. Kiểm tra nhiệt độ pin bằng cảm biến (đọc từ dashboard).\n2. Kiểm tra kết nối cáp sạc — lỏng hoặc hư hỏng.\n3. Xác minh firmware version của BMS (Battery Management System).\n4. Kiểm tra lịch sử sensor readings trong 24h gần nhất.",
    solutionSteps:
      "1. Ngắt nguồn sạc ngay lập tức.\n2. Để pin nguội tự nhiên (không dùng nước).\n3. Kiểm tra và thay cáp sạc nếu hư hỏng.\n4. Cập nhật firmware BMS nếu phiên bản < 2.1.\n5. Theo dõi 48h sau khi sạc lại.",
    recommendedParts: "Cáp sạc OEM model SC-200\nCảm biến nhiệt TS-100",
    tags: ["quá nhiệt", "sạc", "lithium-ion", "BMS"],
    status: KbArticleStatusEnum.Published,
    version: 2,
    viewCount: 156,
    helpfulCount: 42,
    createdByUserId: "user-admin-01",
    createdByFullName: "Nguyễn Văn Admin",
    createdAt: "2026-05-15T08:30:00Z",
    updatedAt: "2026-06-01T14:20:00Z",
  },
  {
    id: "kb-002",
    code: "KB-0002",
    category: 2,
    title: "Chẩn đoán sụt SOH đột ngột trên pin năng lượng mặt trời",
    symptoms:
      "SOH giảm >5% trong vòng 1 tuần.\nDung lượng thực tế thấp hơn nhiều so với dung lượng danh định.\nChu kỳ sạc/xả ngắn bất thường.",
    diagnosisSteps:
      "1. Xem biểu đồ SOH trend trên dashboard (30 ngày).\n2. So sánh voltage profile giữa các chu kỳ gần nhất.\n3. Kiểm tra nhiệt độ vận hành — exposure kéo dài >40°C gây degradation.\n4. Kiểm tra số chu kỳ sạc/xả tích lũy.",
    solutionSteps:
      "1. Chạy full calibration cycle (xả xuống 10%, sạc lên 100%).\n2. Đo lại SOH sau calibration.\n3. Nếu SOH vẫn thấp: báo cáo Manager để đánh giá thay thế.\n4. Ghi nhận vào maintenance log với dữ liệu before/after.",
    recommendedParts: null,
    tags: ["SOH", "degradation", "calibration", "năng lượng mặt trời"],
    status: KbArticleStatusEnum.Published,
    version: 1,
    viewCount: 89,
    helpfulCount: 28,
    createdByUserId: "user-admin-01",
    createdByFullName: "Nguyễn Văn Admin",
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: null,
  },
  {
    id: "kb-003",
    code: "KB-0003",
    category: 1,
    title: "Hướng dẫn thay thế module pin hỏng tại site",
    symptoms:
      "Module pin không phản hồi (voltage = 0V).\nBMS báo lỗi cell fault.\nĐèn trạng thái tắt hoàn toàn.",
    diagnosisSteps:
      "1. Đo voltage từng cell bằng multimeter.\n2. Kiểm tra kết nối BMS bus.\n3. Test isolation resistance giữa module và khung.",
    solutionSteps:
      "1. Ngắt kết nối module khỏi string.\n2. Tháo module cũ theo quy trình ESD.\n3. Lắp module mới, kiểm tra polarization.\n4. Kết nối lại và chạy balancing cycle.\n5. Chụp ảnh before/after, ghi vào maintenance log.",
    recommendedParts:
      "Module pin LFP-48V-100Ah\nBulong cách điện M8\nKeo tản nhiệt TC-500",
    tags: ["thay thế", "module", "on-site", "LFP"],
    status: KbArticleStatusEnum.Draft,
    version: 1,
    viewCount: 12,
    helpfulCount: 3,
    createdByUserId: "user-manager-01",
    createdByFullName: "Trần Thị Manager",
    createdAt: "2026-06-05T09:15:00Z",
    updatedAt: null,
  },
  {
    id: "kb-004",
    code: "KB-0004",
    category: 3,
    title: "Quy trình kiểm tra định kỳ hệ thống pin mặt trời",
    symptoms:
      "Áp dụng cho bảo trì định kỳ — không cần triệu chứng cụ thể.\nThực hiện mỗi 3 tháng theo SLA.",
    diagnosisSteps:
      "1. Kiểm tra visual: hư hỏng vật lý, ăn mòn, rò rỉ.\n2. Đo voltage, current, temperature toàn hệ thống.\n3. Kiểm tra kết nối đầu cực.\n4. Test chức năng BMS protection (over-voltage, under-voltage, over-current).",
    solutionSteps:
      "1. Vệ sinh bề mặt pin và tản nhiệt.\n2. Siết lại đầu cực lỏng (torque 8-10 Nm).\n3. Cập nhật firmware nếu có phiên bản mới.\n4. Ghi nhận tất cả số liệu đo vào maintenance log.\n5. Đánh dấu completion trong ticket system.",
    recommendedParts: "Cồn isopropyl IPA 99%\nTorque wrench 5-25 Nm",
    tags: ["bảo trì", "định kỳ", "kiểm tra", "preventive"],
    status: KbArticleStatusEnum.Published,
    version: 3,
    viewCount: 234,
    helpfulCount: 67,
    createdByUserId: "user-admin-01",
    createdByFullName: "Nguyễn Văn Admin",
    createdAt: "2026-04-10T07:00:00Z",
    updatedAt: "2026-06-08T16:30:00Z",
  },
  {
    id: "kb-005",
    code: "KB-0005",
    category: 2,
    title: "Xử lý mất kết nối sensor IoT trên pin",
    symptoms:
      "Dashboard không hiển thị dữ liệu real-time.\nSensor readings ngừng cập nhật >15 phút.\nTrạng thái sensor: Offline.",
    diagnosisSteps:
      "1. Kiểm tra nguồn cấp sensor (pin CR2032 hoặc dây cấp).\n2. Ping gateway IoT từ network.\n3. Kiểm tra signal strength (RSSI) trên dashboard.\n4. Xem log lỗi kết nối gần nhất.",
    solutionSteps:
      "1. Thay pin sensor nếu voltage < 2.5V.\n2. Reset sensor bằng nút nhấn (giữ 5s).\n3. Kiểm tra và restart gateway nếu cần.\n4. Re-pair sensor với gateway.\n5. Xác nhận data streaming lại bình thường trên dashboard.",
    recommendedParts: "Pin CR2032\nSensor module SM-IoT-v3",
    tags: ["sensor", "IoT", "kết nối", "gateway"],
    status: KbArticleStatusEnum.Archived,
    version: 1,
    viewCount: 45,
    helpfulCount: 10,
    createdByUserId: "user-manager-01",
    createdByFullName: "Trần Thị Manager",
    createdAt: "2026-03-20T11:00:00Z",
    updatedAt: "2026-05-01T08:00:00Z",
  },
];

export const MOCK_KB_SUMMARIES: KbArticleSummaryDTO[] = MOCK_KB_ARTICLES.map(
  ({ id, code, title, category, status, tags, viewCount, helpfulCount }) => ({
    id,
    code,
    title,
    category,
    status,
    tags,
    viewCount,
    helpfulCount,
  }),
);

export const MOCK_TICKET_KB_REFS: TicketKbReferenceDTO[] = [
  {
    id: "ref-001",
    ticketId: "ticket-001",
    kbArticleId: "kb-001",
    kbArticleCode: "KB-0001",
    kbArticleTitle: "Xử lý pin lithium-ion quá nhiệt khi sạc",
    referencedByUserId: "user-staff-01",
    referenceType: KbReferenceTypeEnum.ConsultedDuringResolve,
    note: "Áp dụng bước 1-3 trong solution",
    createdAt: "2026-06-10T14:30:00Z",
  },
  {
    id: "ref-002",
    ticketId: "ticket-001",
    kbArticleId: "kb-004",
    kbArticleCode: "KB-0004",
    kbArticleTitle: "Quy trình kiểm tra định kỳ hệ thống pin mặt trời",
    referencedByUserId: "user-staff-01",
    referenceType: KbReferenceTypeEnum.ProvidedToCustomer,
    note: null,
    createdAt: "2026-06-10T15:00:00Z",
  },
];
