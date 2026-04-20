import { describe, expect, it } from "vitest";
import { isEnabledAdapterType, listAdapterOptions } from "./metadata";
import type { UIAdapterModule } from "./types";

const externalAdapter: UIAdapterModule = {
  type: "external_test",
  label: "External Test",
  parseStdoutLine: () => [],
  ConfigFields: () => null,
  buildAdapterConfig: () => ({}),
};

describe("adapter metadata", () => {
  it("treats registered external adapters as enabled by default", () => {
    expect(isEnabledAdapterType("external_test")).toBe(true);

    expect(
      listAdapterOptions((type) => type, [externalAdapter]),
    ).toEqual([
      {
        value: "external_test",
        label: "external_test",
        comingSoon: false,
        hidden: false,
      },
    ]);
  });

  it("enables the generic process and http transport adapters", () => {
    expect(isEnabledAdapterType("process")).toBe(true);
    expect(isEnabledAdapterType("http")).toBe(true);
  });

  it("keeps openclaw_gateway marked as coming soon (configured via a separate flow)", () => {
    expect(isEnabledAdapterType("openclaw_gateway")).toBe(false);
  });
});