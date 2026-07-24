// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";

const sourceDateEpoch = "946684800";

function runPnpm(args, captureOutput = false) {
  const result = spawnSync("pnpm", args, {
    encoding: captureOutput ? "utf8" : undefined,
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

async function hashFiles(root, current = root) {
  const hashes = [];
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

function pack(destination) {
  const output = runPnpm(
    ["pack", "--json", "--pack-destination", destination],
    true,
  );
  return JSON.parse(output);
}

async function buildAndPack(destination) {
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
    "Repeated builds produced different files",
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
    "Build output contains unexpected files",
  );

  const firstFilename = basename(firstBuild.archive.filename);
  const secondFilename = basename(secondBuild.archive.filename);
  assert.equal(secondFilename, firstFilename, "Package names differ");

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
    "Package contents differ from the public contract",
  );
  assert.deepEqual(
    secondBuild.archive.files.map(({ path }) => path).sort(),
    expectedPackageFiles,
    "Repeated package contents differ from the public contract",
  );

  assert.deepEqual(
    await readFile(join(secondDestination, secondFilename)),
    await readFile(join(firstDestination, firstFilename)),
    "Repeated package archives differ",
  );
} finally {
  await rm(workspace, { force: true, recursive: true });
}

process.stdout.write("Build outputs and package archives are reproducible.\n");
