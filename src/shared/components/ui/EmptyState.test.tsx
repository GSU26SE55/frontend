import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BatteryWarning } from "lucide-react";
import { EmptyState } from "@/shared/components/ui/EmptyState";

describe("EmptyState", () => {
  it("hiện câu mặc định khi không truyền gì", () => {
    render(<EmptyState />);
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("hiện tiêu đề và mô tả được truyền vào", () => {
    render(
      <EmptyState title="Không có ticket" description="Thử bỏ bớt bộ lọc." />,
    );
    expect(screen.getByText("Không có ticket")).toBeInTheDocument();
    expect(screen.getByText("Thử bỏ bớt bộ lọc.")).toBeInTheDocument();
  });

  // Phần lớn chỗ dùng chỉ có tiêu đề; một dòng mô tả rỗng sẽ đội khoảng trắng lên vô cớ.
  it("không dựng khối mô tả khi không có mô tả", () => {
    const { container } = render(<EmptyState title="Trống" />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("không có nút khi không truyền action", () => {
    render(<EmptyState title="Trống" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("bấm nút gọi đúng hàm xử lý", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState title="Trống" action={{ label: "Xoá bộ lọc", onClick }} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Xoá bộ lọc" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("nhận biểu tượng tuỳ biến thay cho mặc định", () => {
    const { container } = render(
      <EmptyState icon={BatteryWarning} title="Trống" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("ghép thêm class truyền vào", () => {
    const { container } = render(<EmptyState className="mt-8" />);
    expect(container.firstElementChild).toHaveClass("mt-8");
  });
});
