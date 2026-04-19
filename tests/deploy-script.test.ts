import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const deployScriptPath = path.join(process.cwd(), "deploy.sh");
const deployScript = readFileSync(deployScriptPath, "utf8");

describe("deploy script", () => {
  test("uses the detected ubuntu codename instead of hardcoded nodistro", () => {
    expect(deployScript).not.toContain(" nodistro main");
    expect(deployScript).toMatch(/UBUNTU_CODENAME|VERSION_CODENAME|lsb_release -cs/);
  });

  test("keeps an official NodeSource fallback when mirror setup fails", () => {
    expect(deployScript).toContain("deb.nodesource.com");
  });
});
