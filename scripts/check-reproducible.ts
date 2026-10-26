// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";

const sourceDateEpoch = "946684800";

function runPnpm(args: readonly string[], captureOutput = false): string {
  const result = spawnSync("pnpm", args, {
    encoding: "utf8",
    env: {
      ...process.env,
      SOURCE_DATE_EPOCH: sourceDateEpoch,
    },
    stdio: captureOutput ? ["ignore", "pipe", "inherit"] : "inherit",
  });

  if (result.error !== undefined) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(" ")} failed with status ${result.status}`);
  }

  return captureOutput ? result.stdout : "";
}

type FileHash = readonly [path: string, digest: string];

async function hashFiles(root: string, current = root): Promise<FileHash[]> {
  const hashes: FileHash[] = [];
  const entries = await readdir(current, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      hashes.push(...(await hashFiles(root, path)));
      continue;
    }
    if (entry.isFile()) {
      const digest = createHash("sha256").update(await readFile(path)).digest("hex");
      hashes.push([relative(root, path), digest]);
    }
  }

  return hashes;
}

type PackedArchive = { readonly filename: string; readonly files: readonly { readonly path: string }[] };

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value);

function packedFile(value: unknown): { readonly path: string } {
  if (isRecord(value) && typeof value.path === "string") return { path: value.path };
  throw new Error("pnpm pack listed a file without a path.");
}

function pack(destination: string): PackedArchive {
  const output = runPnpm(
    ["pack", "--json", "--pack-destination", destination],
    true,
  );
  const archive: unknown = JSON.parse(output);
  if (!isRecord(archive) || typeof archive.filename !== "string" || !isList(archive.files)) {
    throw new Error("pnpm pack --json printed no filename and file list.");
  }
  return { filename: archive.filename, files: archive.files.map(packedFile) };
}

async function buildAndPack(destination: string): Promise<{ archive: PackedArchive; buildFiles: FileHash[] }> {
  await rm("dist", { force: true, recursive: true });
  runPnpm(["build"]);

  return {
    archive: pack(destination),
    buildFiles: await hashFiles("dist"),
  };
}

const workspace = await mkdtemp(join(tmpdir(), "paperclip-xquik-reproducible-"));

try {
  const firstDestination = join(workspace, "first");
  const secondDestination = join(workspace, "second");
  await mkdir(firstDestination);
  await mkdir(secondDestination);

  const firstBuild = await buildAndPack(firstDestination);
  const secondBuild = await buildAndPack(secondDestination);
  assert.deepEqual(
    secondBuild.buildFiles,
    firstBuild.buildFiles,
    "Builds differ. Check nondeterministic output.",
  );

  const expectedBuildFiles = [
    "manifest.js",
    "manifest.js.map",
    "worker.js",
    "worker.js.map",
  ];
  assert.deepEqual(
    firstBuild.buildFiles.map(([path]) => path),
    expectedBuildFiles,
    "Build output changed. Review the package file list.",
  );

  const firstFilename = basename(firstBuild.archive.filename);
  const secondFilename = basename(secondBuild.archive.filename);
  assert.equal(secondFilename, firstFilename, "Package names differ. Check package metadata.");

  const expectedPackageFiles = [
    "LICENSE",
    "README.md",
    "dist/manifest.js",
    "dist/manifest.js.map",
    "dist/worker.js",
    "dist/worker.js.map",
    "package.json",
  ];
  assert.deepEqual(
    firstBuild.archive.files.map(({ path }) => path).sort(),
    expectedPackageFiles,
    "Package contents changed. Review the public file list.",
  );
  assert.deepEqual(
    secondBuild.archive.files.map(({ path }) => path).sort(),
    expectedPackageFiles,
    "Package contents differ between builds. Check nondeterministic files.",
  );

  assert.deepEqual(
    await readFile(join(secondDestination, secondFilename)),
    await readFile(join(firstDestination, firstFilename)),
    "Package archives differ. Check timestamps and generated metadata.",
  );
} finally {
  await rm(workspace, { force: true, recursive: true });
}

process.stdout.write("Verified reproducible build output and package archives.\n");
