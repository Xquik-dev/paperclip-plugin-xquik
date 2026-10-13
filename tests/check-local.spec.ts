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
// A fake records its call and fails when FAKE_FAILS equals that call.
// It also answers what the script reads, such as the pinned pnpm version.
const fakeCommand = `#!/bin/sh
call="\${0##*/} $*"
printf '%s\\n' "$call" >> "$FAKE_CALLS"
case "$call" in
  "git rev-parse HEAD") printf '%s\\n' "$FAKE_SHA" ;;
  "git status --porcelain") printf '%s' "$FAKE_LOCAL_CHANGES" ;;
  "node -p "*) printf '%s\\n' "$FAKE_PACKAGE_MANAGER" ;;
  *" --version") printf '%s\\n' "$FAKE_PNPM_VERSION" ;;
esac
if [ "$call" = "$FAKE_FAILS" ]; then
  exit 1
fi
`;

const script = fileURLToPath(new URL("../bin/check-local", import.meta.url));
const sha = "0123456789abcdef0123456789abcdef01234567";
const statusUrl = `repos/Xquik-dev/paperclip-plugin-xquik/statuses/${sha}`;
const readPin = "node -p require('./package.json').packageManager";
const lintLicenses = "uvx --from reuse==6.2.0 reuse lint";
const corepackPnpm = "corepack pnpm";
const bunxPnpm = "bunx @pnpm/exe@12.11.2";

function checks(pnpm: string): string[] {
  return [
    readPin,
    `${pnpm} --version`,
    lintLicenses,
    `${pnpm} install --frozen-lockfile`,
    `${pnpm} check`,
    `${pnpm} check:reproducible`,
    `${pnpm} audit --audit-level=low`,
    `${pnpm} pack --dry-run`,
  ];
}

interface RunOptions {
  readonly args?: readonly string[];
  readonly fails?: string;
  readonly localChanges?: string;
  readonly missing?: readonly string[];
  readonly packageManager?: string;
  readonly pnpmVersion?: string;
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
    for (const command of ["git", "gh", "node", "uvx", "corepack", "bunx"]) {
      if (!options.missing?.includes(command)) {
        writeFileSync(join(bin, command), fakeCommand, { mode: 0o755 });
      }
    }

    const result = spawnSync("/bin/bash", [script, ...(options.args ?? [])], {
      encoding: "utf8",
      env: {
        FAKE_CALLS: callLog,
        FAKE_FAILS: options.fails ?? "",
        FAKE_LOCAL_CHANGES: options.localChanges ?? "",
        FAKE_PACKAGE_MANAGER: options.packageManager ?? "pnpm@12.11.2",
        FAKE_PNPM_VERSION: options.pnpmVersion ?? "12.11.2",
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

  it("runs the checks in order through corepack and posts no status with --no-status", () => {
    expect.assertions(4);

    const result = run({ args: ["--no-status"] });

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual(checks(corepackPnpm));
    expect(result.stdout).toContain("Running pnpm 12.11.2 through corepack pnpm.\n");
    expect(result.stdout.endsWith("All checks passed.\n")).toBe(true);
  });

  it.each([{ packageManager: "pnpm@12.11.2" }, { packageManager: "pnpm@12.11.2+sha512.0a1b" }])(
    "runs the pnpm that $packageManager pins through bunx when corepack is missing",
    ({ packageManager }) => {
      expect.assertions(3);

      const result = run({ args: ["--no-status"], missing: ["corepack"], packageManager });

      expect(result.exitCode).toBe(0);
      expect(result.calls).toEqual(checks(bunxPnpm));
      expect(result.stdout).toContain("Running pnpm 12.11.2 through bunx @pnpm/exe@12.11.2.\n");
    },
  );

  it("stops with 1 line when neither corepack nor bunx is installed", () => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"], missing: ["corepack", "bunx"] });

    expect(result.exitCode).toBe(1);
    expect(result.calls).toEqual([readPin]);
    expect(result.stderr).toBe(
      "The pnpm setup check failed. Install Bun or corepack to run pnpm, then retry.\n",
    );
  });

  it("stops when it cannot read the pinned pnpm version", () => {
    expect.assertions(2);

    const result = run({ args: ["--no-status"], fails: readPin });

    expect(result.exitCode).toBe(1);
    expect(result.calls).toEqual([readPin]);
  });

  it.each([
    { name: "another version", pnpmVersion: "12.0.0", reported: "12.0.0" },
    { name: "nothing", pnpmVersion: "", reported: "no version" },
    { name: "a failure", fails: "corepack pnpm --version", reported: "no version" },
  ])("stops with 1 line when pnpm reports $name", ({ fails, pnpmVersion, reported }) => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"], fails, pnpmVersion });

    expect(result.exitCode).toBe(1);
    expect(result.calls).toEqual([readPin, "corepack pnpm --version"]);
    expect(result.stderr).toBe(
      `The pnpm setup check failed. The pinned pnpm is 12.11.2, but corepack pnpm reported ${reported}.\n`,
    );
  });

  it("stops with 1 line when uv is not installed", () => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"], missing: ["uvx"] });

    expect(result.exitCode).toBe(1);
    expect(result.calls).toEqual([readPin, "corepack pnpm --version"]);
    expect(result.stderr).toBe(
      "The license metadata check failed. Install uv to run it, then retry.\n",
    );
  });

  it.each([
    {
      fails: lintLicenses,
      ran: 3,
      line: "The license metadata check failed. Add SPDX headers or a REUSE.toml entry for the files it lists.",
    },
    {
      fails: "corepack pnpm install --frozen-lockfile",
      ran: 4,
      line: "The install check failed. Follow the pnpm message above, then retry.",
    },
    {
      fails: "corepack pnpm check",
      ran: 5,
      line: "The types, tests and build check failed. Fix the error it reports, or cover the lines it lists.",
    },
    {
      fails: "corepack pnpm check:reproducible",
      ran: 6,
      line: "The reproducible package check failed. Remove timestamps or other changing output from the build.",
    },
    {
      fails: "corepack pnpm audit --audit-level=low",
      ran: 7,
      line: "The dependency audit check failed. Update the vulnerable dependency, then retry.",
    },
    {
      fails: "corepack pnpm pack --dry-run",
      ran: 8,
      line: "The package contents check failed. Fix the files list in package.json.",
    },
  ])("stops at a failed $fails with 1 line and the next step", ({ fails, ran, line }) => {
    expect.assertions(3);

    const result = run({ args: ["--no-status"], fails });

    expect(result.exitCode).toBe(1);
    expect(result.calls).toEqual(checks(corepackPnpm).slice(0, ran));
    expect(result.stderr).toBe(`${line}\n`);
  });

  it("posts pending and success to the commit it checked", () => {
    expect.assertions(2);

    const result = run();

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual([
      `gh api --silent repos/Xquik-dev/paperclip-plugin-xquik/commits/${sha}`,
      `gh api --silent ${statusUrl} -f state=pending -f context=xquik-local-checks -f description=Running local checks.`,
      ...checks(corepackPnpm),
      `gh api --silent ${statusUrl} -f state=success -f context=xquik-local-checks -f description=REUSE, install, types, tests, build, reproducible package, audit & pack passed`,
    ]);
  });

  it("posts a failure that names the failed check", () => {
    expect.assertions(2);

    const result = run({ fails: "corepack pnpm audit --audit-level=low" });

    expect(result.exitCode).toBe(1);
    expect(result.calls.at(-1)).toBe(
      `gh api --silent ${statusUrl} -f state=failure -f context=xquik-local-checks -f description=Failed at dependency audit. Earlier checks passed.`,
    );
  });

  it("posts no status while the tree has local changes", () => {
    expect.assertions(3);

    const result = run({ localChanges: " M README.md\n" });

    expect(result.exitCode).toBe(0);
    expect(result.calls).toEqual(checks(corepackPnpm));
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
