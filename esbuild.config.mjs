import esbuild from "esbuild";

const shared = {
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  packages: "external",
  sourcemap: true,
};

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: ["src/worker.ts"],
    outfile: "dist/worker.js",
  }),
  esbuild.build({
    ...shared,
    entryPoints: ["src/manifest.ts"],
    outfile: "dist/manifest.js",
  }),
]);
