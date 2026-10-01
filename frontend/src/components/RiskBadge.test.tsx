import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("renders the label for each risk level, not color alone", () => {
    const { rerender } = render(<RiskBadge level="LOW" />);
    expect(screen.getByText("Low risk")).toBeInTheDocument();

    rerender(<RiskBadge level="MEDIUM" />);
    expect(screen.getByText("Medium risk")).toBeInTheDocument();

    rerender(<RiskBadge level="HIGH" />);
    expect(screen.getByText("High risk")).toBeInTheDocument();

    rerender(<RiskBadge level="NOT_YET_PREDICTED" />);
    expect(screen.getByText("Not yet predicted")).toBeInTheDocument();
  });
});
