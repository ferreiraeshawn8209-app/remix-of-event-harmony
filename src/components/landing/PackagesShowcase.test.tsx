import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PackagesShowcase } from "@/components/landing/PackagesShowcase";

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

vi.mock("@/hooks/usePackages", () => ({
  usePackages: () => ({
    isLoading: false,
    packages: [
      { id: "w1", name: "Wedding Gold", category: "wedding", description: "", price: 1000, includes: [], popular: false, is_active: true, sort_order: 1 },
      { id: "c1", name: "Corporate Prime", category: "corporate", description: "", price: 900, includes: [], popular: false, is_active: true, sort_order: 2 },
      { id: "p1", name: "Party Starter", category: "party", description: "", price: 800, includes: [], popular: false, is_active: true, sort_order: 3 },
      { id: "k1", name: "Kids Celebration", category: "kids", description: "", price: 700, includes: [], popular: false, is_active: true, sort_order: 4 },
    ],
  }),
}));

vi.mock("@/lib/activeDiscount", () => ({
  useActiveDiscount: () => ({ percent: 0, title: null }),
  applyDiscount: (price: number) => price,
}));

describe("PackagesShowcase", () => {
  it("renders all active curated packages without truncating non-default categories", () => {
    render(
      <MemoryRouter>
        <PackagesShowcase />
      </MemoryRouter>,
    );

    expect(screen.getByText("Wedding Gold")).toBeInTheDocument();
    expect(screen.getByText("Corporate Prime")).toBeInTheDocument();
    expect(screen.getByText("Party Starter")).toBeInTheDocument();
    expect(screen.getByText("Kids Celebration")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kids Packages" })).toBeInTheDocument();
  });
});
