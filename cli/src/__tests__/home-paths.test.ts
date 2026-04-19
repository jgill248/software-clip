import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveSoftclipHomeDir,
  resolveSoftclipInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to ~/.softclip and default instance", () => {
    delete process.env.SOFTCLIP_HOME;
    delete process.env.SOFTCLIP_INSTANCE_ID;

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(os.homedir(), ".softclip"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(os.homedir(), ".softclip", "instances", "default", "config.json"));
  });

  it("supports SOFTCLIP_HOME and explicit instance ids", () => {
    process.env.SOFTCLIP_HOME = "~/softclip-home";

    const home = resolveSoftclipHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "softclip-home"));
    expect(resolveSoftclipInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveSoftclipInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
