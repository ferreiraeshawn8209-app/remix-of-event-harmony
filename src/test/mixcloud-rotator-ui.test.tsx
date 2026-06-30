import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MixcloudRotator } from "@/components/MixcloudRotator";

describe("MixcloudRotator", () => {
  it("shows a backup Mixcloud link below the player", () => {
    render(<MixcloudRotator />);

    const link = screen.getByRole("link", {
      name: "Having trouble with the player? Open on Mixcloud",
    });

    expect(link).toHaveAttribute("href", "https://www.mixcloud.com/Beatkulture/uploads/");
  });
});
