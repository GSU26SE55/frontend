import { describe, expect, it, vi, beforeAll } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TicketCommentThread } from "@/shared/components/ticket/TicketCommentThread";
import type { TicketCommentDTO } from "@/shared/types/ticket/ticket.types";

// Callbacks registered by the component's IntersectionObservers. Held rather than fired on
// observe() so a test can say exactly WHEN the reader reaches the bottom — firing immediately
// would mean every thread counts as read the instant it renders.
let ioCallbacks: IntersectionObserverCallback[] = [];

const reachBottom = () =>
  act(() => {
    ioCallbacks.forEach((cb) =>
      cb(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
  });

beforeAll(() => {
  class IO {
    cb: IntersectionObserverCallback;
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe() {
      ioCallbacks.push(this.cb);
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", IO);
  // Neither is implemented in jsdom: the thread auto-scrolls its container to the newest
  // message, and the jump-to-pinned-message handler calls scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});

const ME = "me-1";
const THEM = "them-1";

const msg = (
  id: string,
  authorUserId: string,
  isRead: boolean,
): TicketCommentDTO =>
  ({
    id,
    ticketId: "t-1",
    authorUserId,
    authorRole: "Staff",
    authorDisplayName: authorUserId === ME ? "Me" : "Them",
    body: `body-${id}`,
    isInternal: false,
    createdAt: `2026-08-30T10:0${id.at(-1)}:00Z`,
    isRead,
  }) as TicketCommentDTO;

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Thread({
  comments,
  client,
}: {
  comments: TicketCommentDTO[];
  client: QueryClient;
}) {
  return (
    <QueryClientProvider client={client}>
      <TicketCommentThread
        comments={comments}
        currentUserId={ME}
        ticketId="t-1"
      />
    </QueryClientProvider>
  );
}

describe("TicketCommentThread — dòng Unread", () => {
  it("hiện dòng Unread cho backlog chưa đọc khi mới mở thread", () => {
    ioCallbacks = [];
    render(
      <Thread
        client={makeClient()}
        comments={[
          msg("m1", THEM, false),
          msg("m2", THEM, false),
          msg("m3", ME, true),
        ]}
      />,
    );

    expect(screen.getByText(/2 unread messages/i)).toBeInTheDocument();
  });

  // Kịch bản QA: 2 người cùng mở 1 ticket, người kia nhắn trong lúc mình đang xem.
  // Dòng đỏ chỉ dành cho backlog lúc mở thread — nó KHÔNG được khoá lại lần nữa rồi nhảy lên
  // giữa luồng chat khi có tin mới tới.
  it("không khoá lại dòng Unread khi backlog đã đọc xong và có tin mới tới", () => {
    ioCallbacks = [];
    const client = makeClient();
    const { rerender } = render(
      <Thread
        client={client}
        comments={[msg("m1", THEM, true), msg("m2", ME, true)]}
      />,
    );

    // Người dùng cuộn tới đáy → backlog coi như đã đọc.
    reachBottom();
    expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();

    // Người kia nhắn tiếp; BE trả isRead=false cho tới khi mark-read chạy xong.
    rerender(
      <Thread
        client={client}
        comments={[
          msg("m1", THEM, true),
          msg("m2", ME, true),
          msg("m3", THEM, false),
        ]}
      />,
    );

    expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
  });

  // Dòng đỏ được ghim lại lúc mở thread (mark-read tự chạy ngay, nếu tính lại từ dữ liệu mới
  // thì nó biến mất trước khi người dùng kịp thấy). Nhưng khi đã cuộn tới đáy VÀ BE báo hết
  // chưa đọc thì nó phải tự tắt — trước đây giữ nguyên cả phiên nên dòng đỏ mắc kẹt trên màn
  // hình dù đã đọc hết.
  it("tự tắt dòng Unread sau khi cuộn tới đáy và BE báo đã đọc hết", () => {
    ioCallbacks = [];
    const client = makeClient();
    const { rerender } = render(
      <Thread
        client={client}
        comments={[msg("m1", THEM, false), msg("m2", ME, true)]}
      />,
    );

    expect(screen.getByText(/unread message/i)).toBeInTheDocument();

    // Cuộn tới đáy + BE xác nhận đã đọc → dòng đỏ hết việc.
    reachBottom();
    rerender(
      <Thread
        client={client}
        comments={[msg("m1", THEM, true), msg("m2", ME, true)]}
      />,
    );

    expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
  });

  // "New messages" đã được bỏ theo yêu cầu: nó chớp lên rồi tắt ngay khi người đọc đang ở
  // đáy luồng, nên chỉ gây nhiễu chứ không cho biết thêm điều gì.
  it("không còn dòng New messages", () => {
    ioCallbacks = [];
    const client = makeClient();
    const { rerender } = render(
      <Thread client={client} comments={[msg("m1", ME, true)]} />,
    );

    rerender(
      <Thread
        client={client}
        comments={[msg("m1", ME, true), msg("m2", THEM, false)]}
      />,
    );

    expect(screen.queryByText(/new messages/i)).not.toBeInTheDocument();
  });
});
