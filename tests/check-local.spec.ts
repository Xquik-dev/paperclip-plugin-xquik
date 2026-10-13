// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The script finds only these fakes on PATH, plus the real dirname.
// A fake records its arguments and fails when FAKE_FAILS names it and its
// first argument.
const fakeCommand = `#!/bin/sh
name=\${0##*/}
printf '%s\\n' "$name $*" >> "$FAKE_CALLS"
case "$name $1 $2" in
  "git rev-parse HEAD") printf '%s\\n' "$FAKE_SHA" ;;
  "git status --porcelain") printf '%s' "$FAKE_LOCAL_CHANGES" ;;
esac
if [ "$name $1" = "$FAKE_FAILS" ]; then
  exit 1
fi
`;

const script = fileURLToPath(new URL("../bin/check-local", import.meta.url));
const sha = "0123456789abcdef0123456789abcdef01234567";
const statusUrl = `repos/Xquik-dev/paperclip-plugin-xquik/statuses/${sha}`;
const checks = [
  "reuse lint",
  "pnpm --version",
  "pnpm install --frozen-lockfile",
  "pnpm check",
  "pnpm check:reproducible",
  "pnpm audit --audit-level=low",
  "pnpm pack --dry-run",
];

interface RunOptions {
  readonly args?: readonly string[];
  readonly commands?: readonly string[];
  readonly fails?: string;
  readonly localChanges?: string;
}

interface RunResult {
  readonly calls: readonly string[];
  readonly exitCode: number | null;
  readonly stderr: string;
  readonly stdout: string;
}

describe("bin/check-local", () => {
  let workspace = "";

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), "paperclip-xquik-check-local-"));
  });

  afterEach(() => {
    rmSync(workspace, { force: true, recursive: true });
  });

  function run(options: RunOptions = {}): RunResult {
    const bin = join(workspace, "bin");
    const callLog = join(workspace, "calls.log");
    mkdirSync(bin);
    writeFileSync(callLog, "");
    symlinkSync("/usr/bin/dirname", join(bin, "dirname"));
    for (const command of options.commands ?? ["git", "gh", "pnpm", "reuse"]) {
      writeFileSync(join(bin, command), fakeCommand, { mode: 0o755 });
    }

    const result = spawnSync("/bin/bash", [script, ...(options.args ?? [])], {
      encoding: "utf8",
      env: {
        FAKE_CALLS: callLog,
        FAKE_FAILS: options.fails ?? "",
        FAKE_LOCAL_CHANGES: options.localChanges ?? "",
        FAKE_SHA: sha,
        PATH: bin,
      },
    });

    return {
      calls: readFileSync(callLog, "utf8")
        .split("\n")
        .filter((call) => call !== "" && !call.startsWith("git ")),
      exitCode: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  }

  it("runs the checks in order and posts no status with --no-status", () => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"] });

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual(checks);
    expect(result.stdout.endsWith("All checks passed.\n")).toBe(true);
  });

  it.each([
    {
      fails: "reuse lint",
      ran: 1,
      line: "The license metadata check failed. Add SPDX headers or a REUSE.toml entry for the files it lists.",
    },
    {
      fails: "pnpm --version",
      ran: 2,
      line: "The pnpm version check failed. Install the pnpm version that package.json pins, then retry.",
    },
    {
      fails: "pnpm install",
      ran: 3,
      line: "The install check failed. Follow the pnpm message above, then retry.",
    },
    {
      fails: "pnpm check",
      ran: 4,
      line: "The types, tests and build check failed. Fix the error it reports, or cover the lines it lists.",
    },
    {
      fails: "pnpm check:reproducible",
      ran: 5,
      line: "The reproducible package check failed. Remove timestamps or other changing output from the build.",
    },
    {
      fails: "pnpm audit",
      ran: 6,
      line: "The dependency audit check failed. Update the vulnerable dependency, then retry.",
    },
    {
      fails: "pnpm pack",
      ran: 7,
      line: "The package contents check failed. Fix the files list in package.json.",
    },
  ])("stops at a failed $fails with 1 line and the next step", ({ fails, ran, line }) => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"], fails });

    expect(result.exitCode).toBe(1);
    expect(result.calls).toEqual(checks.slice(0, ran));
    expect(result.stderr).toBe(`${line}\n`);
  });

  it("skips the license check when reuse is not installed", () => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"], commands: ["git", "gh", "pnpm"] });

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual(checks.slice(1));
    expect(result.stdout).toContain("Skipping the license metadata check. Install reuse to run it.\n");
  });

  it("posts pending and success to the commit it checked", () => {
    expect.assertions(2);

    const result = run();

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual([
      `gh api --silent repos/Xquik-dev/paperclip-plugin-xquik/commits/${sha}`,
      `gh api --silent ${statusUrl} -f state=pending -f context=xquik-local-checks -f description=Running local checks.`,
      ...checks,
      `gh api --silent ${statusUrl} -f state=success -f context=xquik-local-checks -f description=REUSE, install, types, tests, build, reproducible package, audit & pack passed`,
    ]);
  });

  it("posts a failure that names the failed check", () => {
    expect.assertions(2);

    const result = run({ fails: "pnpm audit" });

    expect(result.exitCode).toBe(1);
    expect(result.calls.at(-1)).toBe(
      `gh api --silent ${statusUrl} -f state=failure -f context=xquik-local-checks -f description=Failed at dependency audit. Earlier checks passed.`,
    );
  });

  it("posts no status while the tree has local changes", () => {
    expect.assertions(3);

    const result = run({ localChanges: " M README.md\n" });

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual(checks);
    expect(result.stdout).toContain(
      "Not posting the xquik-local-checks status. Commit or remove local changes first.\n",
    );
  });

  it("rejects an unknown option before it runs a check", () => {
    expect.assertions(3);

    const result = run({ args: ["--fast"] });

    expect(result.exitCode).toBe(2);
    expect(result.calls).toEqual([]);
    expect(result.stderr).toBe(
      "Unknown option --fast. Run bin/check-local or bin/check-local --no-status.\n",
    );
  });
});
