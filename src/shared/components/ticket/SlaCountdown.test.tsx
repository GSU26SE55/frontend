import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import SlaCountdown from "./SlaCountdown";
import {
  SlaTimerStatusEnum,
  TicketPriorityEnum,
} from "@/shared/types/ticket/ticket.types";
import type { SlaTimerDTO } from "@/shared/types/ticket/ticket.types";

const timer = (
  overrides: Partial<SlaTimerDTO> & Pick<SlaTimerDTO, "dueAt" | "status">,
): SlaTimerDTO => ({
  id: "t1",
  priority: TicketPriorityEnum.P3Normal,
  startedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  originalDueAt: overrides.dueAt,
  remainingPercent: 0,
  totalPausedMinutes: 0,
  ...overrides,
});

afterEach(() => vi.useRealTimers());

describe("SlaCountdown past the deadline", () => {
  it("shows Breached and stops counting when a running timer reaches zero", () => {
    vi.useFakeTimers();
    render(
      <SlaCountdown
        compact
        slaTimer={timer({
          dueAt: new Date(Date.now() - 1000).toISOString(),
          status: SlaTimerStatusEnum.Running,
        })}
      />,
    );

    expect(screen.getByText("Breached")).toBeInTheDocument();

    // The overdue time must NOT tick upwards after the breach.
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByText("Breached")).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it("shows Breached for a timer the BE already flipped", () => {
    render(
      <SlaCountdown
        compact
        slaTimer={timer({
          dueAt: new Date(Date.now() - 3600_000).toISOString(),
          status: SlaTimerStatusEnum.Breached,
        })}
      />,
    );

    expect(screen.getByText("Breached")).toBeInTheDocument();
  });
});
