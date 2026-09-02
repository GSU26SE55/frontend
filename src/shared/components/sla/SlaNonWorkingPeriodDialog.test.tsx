import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlaNonWorkingPeriodDialog from "./SlaNonWorkingPeriodDialog";

const createPeriod = vi.fn().mockResolvedValue({});
const updatePeriod = vi.fn().mockResolvedValue({});

vi.mock("@/shared/hooks/sla/useSlaCalendar", () => ({
  useCreateSlaNonWorkingPeriod: () => ({ mutateAsync: createPeriod }),
  useUpdateSlaNonWorkingPeriod: () => ({ mutateAsync: updatePeriod }),
}));

/** "yyyy-MM-dd" `offsetDays` from today — the value an <input type="date"> holds. */
const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
};

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  fireEvent.change(screen.getByLabelText(/From/i), {
    target: { value: iso(1) },
  });
  fireEvent.change(screen.getByLabelText(/To/i), { target: { value: iso(2) } });
  await user.type(screen.getByLabelText(/Reason/i), "aa");
};

describe("SlaNonWorkingPeriodDialog", () => {
  beforeEach(() => createPeriod.mockClear());

  it("submits what the fields show", async () => {
    const user = userEvent.setup();
    render(<SlaNonWorkingPeriodDialog open onOpenChange={() => {}} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.queryByText(/is required/i)).toBeNull();
    expect(createPeriod).toHaveBeenCalledWith({
      startDate: iso(1),
      endDate: iso(2),
      reason: "aa",
    });
  });

  it("clears the required errors once the fields are filled", async () => {
    const user = userEvent.setup();
    render(<SlaNonWorkingPeriodDialog open onOpenChange={() => {}} />);

    // Submitting an empty form first is what production showed: the three "required"
    // errors must not survive the fields actually being filled in.
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Reason is required")).toBeInTheDocument();

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.queryByText(/is required/i)).toBeNull();
    expect(createPeriod).toHaveBeenCalledTimes(1);
  });
});
