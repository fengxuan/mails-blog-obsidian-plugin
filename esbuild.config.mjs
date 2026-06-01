import esbuild from "esbuild";
import { builtinModules } from "node:module";
import process from "node:process";

const externalBuiltins = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => moduleName.startsWith("node:") ? moduleName : `node:${moduleName}`),
];

const banner =
  "/* eslint-disable */\n" +
  "// This file is built automatically by esbuild.\n";

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ["main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    ...externalBuiltins,
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: process.argv.includes("production") ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (process.argv.includes("production")) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
