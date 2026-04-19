import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetSoftclipEnvWarnings,
  resolveSoftclipEnv,
  setSoftclipEnvWarnSink,
} from "./resolveSoftclipEnv.js";

describe("resolveSoftclipEnv", () => {
  let warn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    warn = vi.fn();
    setSoftclipEnvWarnSink(warn);
    resetSoftclipEnvWarnings();
  });

  afterEach(() => {
    setSoftclipEnvWarnSink(null);
    resetSoftclipEnvWarnings();
  });

  it("returns undefined when neither SOFTCLIP_ nor PAPERCLIP_ is set", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {});
    expect(result).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns the SOFTCLIP_ value with source=softclip and no warning", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {
      SOFTCLIP_PUBLIC_URL: "https://softclip.example",
    });
    expect(result).toEqual({
      value: "https://softclip.example",
      source: "softclip",
      varName: "SOFTCLIP_PUBLIC_URL",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to PAPERCLIP_ with source=paperclip and emits a deprecation warning", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {
      PAPERCLIP_PUBLIC_URL: "https://paperclip.example",
    });
    expect(result).toEqual({
      value: "https://paperclip.example",
      source: "paperclip",
      varName: "PAPERCLIP_PUBLIC_URL",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("PAPERCLIP_PUBLIC_URL is deprecated");
    expect(warn.mock.calls[0]?.[0]).toContain("rename to SOFTCLIP_PUBLIC_URL");
  });

  it("prefers SOFTCLIP_ over PAPERCLIP_ when both are set, with no warning", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {
      SOFTCLIP_PUBLIC_URL: "https://new",
      PAPERCLIP_PUBLIC_URL: "https://old",
    });
    expect(result?.value).toBe("https://new");
    expect(result?.source).toBe("softclip");
    expect(warn).not.toHaveBeenCalled();
  });

  it("only warns once per legacy var across multiple calls", () => {
    const env = { PAPERCLIP_PUBLIC_URL: "https://paperclip.example" };
    resolveSoftclipEnv("PUBLIC_URL", env);
    resolveSoftclipEnv("PUBLIC_URL", env);
    resolveSoftclipEnv("PUBLIC_URL", env);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("warns separately for distinct legacy vars", () => {
    const env = {
      PAPERCLIP_PUBLIC_URL: "https://paperclip.example",
      PAPERCLIP_API_KEY: "legacy-key",
    };
    resolveSoftclipEnv("PUBLIC_URL", env);
    resolveSoftclipEnv("API_KEY", env);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("treats empty string as a set value (does not fall through)", () => {
    const result = resolveSoftclipEnv("PUBLIC_URL", {
      SOFTCLIP_PUBLIC_URL: "",
      PAPERCLIP_PUBLIC_URL: "https://fallback",
    });
    expect(result?.value).toBe("");
    expect(result?.source).toBe("softclip");
    expect(warn).not.toHaveBeenCalled();
  });

  it("reads from process.env by default", () => {
    const original = process.env.SOFTCLIP_TEST_RESOLVER_VAR;
    process.env.SOFTCLIP_TEST_RESOLVER_VAR = "from-process-env";
    try {
      const result = resolveSoftclipEnv("TEST_RESOLVER_VAR");
      expect(result?.value).toBe("from-process-env");
      expect(result?.source).toBe("softclip");
    } finally {
      if (original === undefined) {
        delete process.env.SOFTCLIP_TEST_RESOLVER_VAR;
      } else {
        process.env.SOFTCLIP_TEST_RESOLVER_VAR = original;
      }
    }
  });
});
