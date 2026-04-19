import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const deployScriptPath = path.join(process.cwd(), "deploy.sh");
const deployScript = readFileSync(deployScriptPath, "utf8");
const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
const dockerCompose = readFileSync(dockerComposePath, "utf8");

describe("deploy script", () => {
  test("uses the detected ubuntu codename instead of hardcoded nodistro", () => {
    expect(deployScript).not.toContain(" nodistro main");
    expect(deployScript).toMatch(/UBUNTU_CODENAME|VERSION_CODENAME|lsb_release -cs/);
  });

  test("keeps an official NodeSource fallback when mirror setup fails", () => {
    expect(deployScript).toContain("deb.nodesource.com");
  });

  test("falls back to downloading a repository archive when git clone endpoints fail", () => {
    expect(deployScript).toContain("codeload.github.com");
    expect(deployScript).toMatch(/tar\s+-xzf|unzip/);
  });

  test("forces git clone over HTTP/1.1 to reduce TLS termination issues", () => {
    expect(deployScript).toContain("http.version HTTP/1.1");
  });

  test("allows overriding the postgres image source for restricted network deployments", () => {
    expect(dockerCompose).toContain('${POSTGRES_IMAGE:-postgres:16-alpine}');
  });

  test("retries database startup with mirrored postgres images when docker hub is unavailable", () => {
    expect(deployScript).toContain("POSTGRES_IMAGE=");
    expect(deployScript).toContain("docker.m.daocloud.io/library/postgres:16-alpine");
  });
});
