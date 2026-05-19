import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
  Zap,
  FileText,
  Headphones,
  Heart,
  Shield,
} from 'lucide-react';
import type {
  BatteryRow,
  HeroDemo,
  NavItem,
  ProductCapability,
  RoleItem,
  TicketRow,
  WorkflowItem,
} from '@/features/landing/types/landing.types';
import solarOnlyImg from '@/assets/solar_only.png';
import solarBatteryImg from '@/assets/solar_battery.png';
import solarMonitoringImg from '@/assets/solar_monitoring.png';

export type ProductOption = {
  image: string;
  title: string;
  desc: string;
  features: readonly string[];
};


export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Sản phẩm', href: '#product' },
  { label: 'Quy trình', href: '#workflow' },
  { label: 'Vai trò', href: '#roles' },
  { label: 'Kiểm soát', href: '#governance' },
];

export const HERO_DEMOS: readonly HeroDemo[] = [
  {
    id: 'health',
    label: 'Sức khỏe pin',
    title: 'Theo dõi SOH',
    desc: 'Từ telemetry thô đến điểm sức khỏe pin và danh sách pack cần chú ý.',
    consoleNote: 'Health monitoring view',
    metrics: [
      { label: 'SOH trung bình', value: '86.4%', icon: Gauge },
      { label: 'Pack suy giảm', value: '17', icon: Activity },
      { label: 'Critical pack', value: '3', icon: Zap },
    ],
    steps: ['Nhận telemetry', 'Tính SOH', 'Phân loại rủi ro', 'Ưu tiên pack cần xử lý'],
  },
  {
    id: 'alerts',
    label: 'Cảnh báo bất thường',
    title: 'Phát hiện alert',
    desc: 'Alert hiển thị đúng ngữ cảnh: site, pin, nhiệt độ, mức rủi ro và lịch sử liên quan.',
    consoleNote: 'Anomaly detection view',
    metrics: [
      { label: 'Alert mở', value: '28', icon: AlertTriangle },
      { label: 'P1 hôm nay', value: '3', icon: Zap },
      { label: 'Triage TB', value: '18m', icon: Clock },
    ],
    steps: ['Đọc ngưỡng', 'So bất thường', 'Gom ngữ cảnh', 'Đẩy alert cho manager'],
  },
  {
    id: 'tickets',
    label: 'Tự động tạo ticket',
    title: 'Tạo work order',
    desc: 'Cảnh báo đủ điều kiện được chuyển thành ticket có priority, owner và SLA rõ ràng.',
    consoleNote: 'Ticket automation view',
    metrics: [
      { label: 'Ticket mở', value: '42', icon: Ticket },
      { label: 'Đã phân công', value: '31', icon: Users },
      { label: 'Chưa owner', value: '4', icon: AlertTriangle },
    ],
    steps: ['Nhận alert', 'Gán priority', 'Chọn owner', 'Tạo ticket có SLA'],
  },
  {
    id: 'sla',
    label: 'Kiểm soát SLA',
    title: 'Theo dõi breach',
    desc: 'Hàng chờ bảo trì được xếp theo thời gian còn lại, escalation hiển thị trước khi trễ hạn.',
    consoleNote: 'SLA governance view',
    metrics: [
      { label: 'SLA breach', value: '0', icon: ShieldCheck },
      { label: 'Sắp breach', value: '5', icon: Clock },
      { label: 'Đóng trong ca', value: '17', icon: CheckCircle2 },
    ],
    steps: ['Tính deadline', 'Xếp hàng chờ', 'Nhắc escalation', 'Đóng kèm audit'],
  },
];

export const BATTERY_ROWS: readonly BatteryRow[] = [
  {
    id: 'BAT-0142',
    site: 'Rooftop A',
    soh: 94,
    temp: '31°C',
    trend: '+0.2%',
    status: 'Normal',
    assignee: 'System',
  },
  {
    id: 'BAT-0308',
    site: 'Inverter Yard',
    soh: 72,
    temp: '38°C',
    trend: '-4.8%',
    status: 'Degrading',
    assignee: 'Minh Tran',
  },
  {
    id: 'BAT-0417',
    site: 'Block C',
    soh: 49,
    temp: '46°C',
    trend: '-12.1%',
    status: 'Critical',
    assignee: 'Huy Pham',
  },
];

export const TICKET_ROWS: readonly TicketRow[] = [
  {
    id: 'TCK-2482',
    priority: 'P1',
    title: 'Nhiệt độ cao trên BAT-0417',
    owner: 'Huy Pham',
    sla: '03h 42m',
    status: 'Escalate',
  },
  {
    id: 'TCK-2481',
    priority: 'P2',
    title: 'Xu hướng suy giảm dung lượng',
    owner: 'Minh Tran',
    sla: '18h 21m',
    status: 'Đã giao',
  },
];

export const PRODUCT_OPTIONS: readonly ProductOption[] = [
  {
    image: solarOnlyImg,
    title: 'Solar Only',
    desc: 'Power your home, offset utility costs and join the clean energy movement.',
    features: ['Max solar efficiency', 'Permit and utility approval'],
  },
  {
    image: solarBatteryImg,
    title: 'Solar + Battery',
    desc: 'Store energy for backup power during outages, avoid peak electricity rates and manage energy flow.',
    features: ['Full backup energy storage', 'Avoid peak utility rates'],
  },
  {
    image: solarMonitoringImg,
    title: 'Solar + Battery + Monitoring',
    desc: 'Comprehensive home energy control. Monitor consumption, battery health, and grid export in real-time.',
    features: ['Real-time energy tracking', 'Predictive health alerts'],
  },
];

export const PRODUCT_CAPABILITIES: readonly ProductCapability[] = [
  {
    icon: BarChart3,
    title: 'Sức khỏe pin theo thời gian thực',
    desc: 'SOH, cycle count, nhiệt độ và xu hướng suy giảm trong một giao diện vận hành.',
  },
  {
    icon: Bell,
    title: 'Cảnh báo có ngữ cảnh',
    desc: 'Mỗi cảnh báo đi kèm site, lịch sử asset, severity và ticket liên quan.',
  },
  {
    icon: Clock,
    title: 'Kiểm soát SLA',
    desc: 'Countdown, escalation và người phụ trách hiển thị trước khi ticket trễ hạn.',
  },
  {
    icon: Database,
    title: 'Lịch sử phục vụ audit',
    desc: 'Mọi phân công, thay đổi trạng thái và cập nhật hiện trường đều có thể truy vết.',
  },
];

export const WORKFLOW: readonly WorkflowItem[] = [
  {
    icon: FileText,
    step: '01',
    title: 'Permit & Custom Design',
    desc: 'We manage all local permitting, utility paperwork, and design a customized solar system for your home.',
  },
  {
    icon: Headphones,
    step: '02',
    title: 'Concierge Support',
    desc: 'Your dedicated project manager will guide you through every milestone, handling all scheduling and communications.',
  },
  {
    icon: Activity,
    step: '03',
    title: 'Real-time Monitoring & Backup',
    desc: 'Experience seamless backup power during grid blackouts, and monitor your entire system state via the console.',
  },
  {
    icon: Wrench,
    step: '04',
    title: 'Solar Panel Installation',
    desc: 'Our certified professional team installs your high-performance solar energy system quickly and safely.',
  },
];

export const ROLES: readonly RoleItem[] = [
  {
    role: 'Admin',
    icon: ShieldCheck,
    title: 'Thiết lập chuẩn vận hành',
    desc: 'Cấu hình ngưỡng cảnh báo, escalation policy, phân quyền và thời gian lưu audit.',
  },
  {
    role: 'Manager',
    icon: Users,
    title: 'Điều phối hàng chờ bảo trì',
    desc: 'Cân bằng workload, theo dõi rủi ro SLA và duyệt các escalation quan trọng.',
  },
  {
    role: 'Staff',
    icon: Wrench,
    title: 'Xử lý công việc hiện trường',
    desc: 'Xem việc được giao, làm theo checklist và gửi bằng chứng xử lý từ site.',
  },
];

export const GOVERNANCE_POINTS = [
  'Priority model: P1 trong 4h, P2 trong 24h, P3 trong 72h',
  'Escalation rule minh bạch cho manager và staff',
  'Mọi hành động trên ticket có timestamp, actor và role',
] as const;

export const INDUSTRY_LEADERS_CARDS = [
  {
    title: 'High Performance',
    desc: 'Optimized cells for maximum efficiency and yield.',
    icon: Zap,
  },
  {
    title: 'Delivered on time',
    desc: 'Quick scheduling, packaging, and safe delivery to your site.',
    icon: Clock,
  },
  {
    title: 'Eco-friendly',
    desc: 'Carbon neutral manufacturing, supporting global sustainability.',
    icon: Heart,
  },
  {
    title: 'Built to last',
    desc: 'Robust housing and engineering with 25-year limited warranty.',
    icon: Shield,
  },
] as const;

