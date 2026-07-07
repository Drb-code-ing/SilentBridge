import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentLoadingCard } from "./AgentLoadingCard";

describe("AgentLoadingCard", () => {
  it('渲染包含文案"小桥正在整理..."', () => {
    render(<AgentLoadingCard />);
    expect(screen.getByText("小桥正在整理...")).toBeDefined();
  });

  it("容器有 sb-agent-card-skeleton class", () => {
    const { container } = render(<AgentLoadingCard />);
    const skeleton = container.querySelector(".sb-agent-card-skeleton");
    expect(skeleton).not.toBeNull();
  });

  it("包含 role=status 属性（无障碍）", () => {
    render(<AgentLoadingCard />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("包含占位骨架块", () => {
    const { container } = render(<AgentLoadingCard />);
    const blocks = container.querySelectorAll(".sb-skeleton-block");
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });
});
