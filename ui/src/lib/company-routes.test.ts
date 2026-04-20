import { describe, expect, it } from "vitest";
import {
  applyCompanyPrefix,
  extractCompanyPrefixFromPath,
  isBoardPathWithoutPrefix,
  toCompanyRelativePath,
} from "./company-routes";

describe("company routes", () => {
  it("treats execution workspace paths as board routes that need a company prefix", () => {
    expect(isBoardPathWithoutPrefix("/execution-workspaces/workspace-123")).toBe(true);
    expect(extractCompanyPrefixFromPath("/execution-workspaces/workspace-123")).toBeNull();
    expect(applyCompanyPrefix("/execution-workspaces/workspace-123", "PAP")).toBe(
      "/PAP/execution-workspaces/workspace-123",
    );
  });

  it("normalizes prefixed execution workspace paths back to company-relative paths", () => {
    expect(toCompanyRelativePath("/PAP/execution-workspaces/workspace-123")).toBe(
      "/execution-workspaces/workspace-123",
    );
  });

  it("prefixes the sidebar ceremonies and roadmap routes with the active company", () => {
    // Regression: these two sidebar links previously rendered as
    // `/ceremonies` / `/roadmap`, which the router then treated as the
    // company prefix `CEREMONIES` / `ROADMAP` and 404'd with "Company not found".
    expect(isBoardPathWithoutPrefix("/ceremonies")).toBe(true);
    expect(isBoardPathWithoutPrefix("/roadmap")).toBe(true);
    expect(applyCompanyPrefix("/ceremonies", "OLL")).toBe("/OLL/ceremonies");
    expect(applyCompanyPrefix("/roadmap", "OLL")).toBe("/OLL/roadmap");
    expect(toCompanyRelativePath("/OLL/ceremonies")).toBe("/ceremonies");
    expect(toCompanyRelativePath("/OLL/roadmap")).toBe("/roadmap");
  });
});
