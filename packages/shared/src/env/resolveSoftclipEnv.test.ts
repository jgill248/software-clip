import { describe, expect, it } from "vitest";
import { resolveSoftclipEnv } from "./resolveSoftclipEnv.js";

describe("resolveSoftclipEnv", () => {
  it("returns undefined when SOFTCLIP_<name> is not set", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {});
    expect(result).toBeUndefined();
  });

  it("returns the value and var name when SOFTCLIP_<name> is set", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {
      SOFTCLIP_PUBLIC_URL: "https://softclip.example",
    });
    expect(result).toEqual({
      value: "https://softclip.example",
      varName: "SOFTCLIP_PUBLIC_URL",
    });
  });

  it("treats empty string as a set value", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {
      SOFTCLIP_PUBLIC_URL: "",
    });
    expect(result?.value).toBe("");
  });

  it("reads from process.env by default", () => {
    const original = process.env.SOFTCLIP_TEST_RESOLVER_VAR;
    process.env.SOFTCLIP_TEST_RESOLVER_VAR = "from-process-env";
    try {
      const result = resolveSoftclipEnv("TEST_RESOLVER_VAR");
      expect(result?.value).toBe("from-process-env");
      expect(result?.varName).toBe("SOFTCLIP_TEST_RESOLVER_VAR");
    } finally {
      if (original === undefined) {
        delete process.env.SOFTCLIP_TEST_RESOLVER_VAR;
      } else {
        process.env.SOFTCLIP_TEST_RESOLVER_VAR = original;
      }
    }
  });
});
