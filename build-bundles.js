/*
 * Script for browserifying multiple bundles, since this is a multi-page app.
 *
 * Usage: node build-bundles <input-folder> <output-folder> [-w] [-m] [-v]
 *   -w: watch mode
 *   -m: minify the output
 *   -v: verbose output
 */

import { exec, execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, lstatSync } from "fs";
import path from "path";

main();

function main() {
  const args = process.argv.slice(2);
  const positionalArgs = args.filter((a) => !a.startsWith("-"));

  if (positionalArgs.length != 2) {
    const usageMessage =
      "Usage: node build-bundles <input-folder> <output-folder> [-w] [-m] " +
      "[-v]\n  -w: watch mode\n  -m: minify the output\n  -v: verbose output";
    console.error(usageMessage);
    return;
  }

  const inputFolder = positionalArgs[0];
  const outputFolder = positionalArgs[1];

  if (!existsSync(inputFolder) || !lstatSync(inputFolder).isDirectory()) {
    console.error(`Cannot find folder "${inputFolder}".`);
    return;
  }

  const watch = args.includes("-w");
  const minify = args.includes("-m");
  const verbose = args.includes("-v");

  resetFolder(outputFolder);
  createBundles(inputFolder, outputFolder, minify, watch, verbose);

  if (verbose) {
    console.log("Done.");
  }
}

/**
 * Detects all typescript files in the input folder and creates bundles for them.
 * @param {string} inputFolder The path of the input folder.
 * @param {string} outputFolder The path of the output folder.
 * @param {boolean} minify Whether to minify the output.
 * @param {boolean} watch Whether to enable watch mode.
 * @param {boolean} verbose Whether to print debug information.
 */
function createBundles(inputFolder, outputFolder, minify, watch, verbose) {
  const files = readdirSync(inputFolder);
  for (let i = 0; i < files.length; i++) {
    const filePath = path.parse(files[i]);
    if (filePath.ext != ".ts") {
      continue;
    }

    const tsFile = path.join(inputFolder, `${filePath.name}.ts`);
    const bundleFile = path.join(outputFolder, `${filePath.name}.js`);

    if (verbose) {
      const count = `(${i + 1}/${files.length})`;
      console.log(`Bundling ${tsFile} -> ${bundleFile} ${count}...`);
    }

    esbuild(tsFile, bundleFile, minify, watch, verbose);
  }
}

/**
 * Creates a bundle using browserify.
 * @param {*} tsFile The input file name (including ".ts" suffix).
 * @param {*} bundleFile The output file name (including ".js" suffix).
 * @param {boolean} minify Whether to minify the output.
 * @param {boolean} watch Whether to enable watch mode.
 * @param {boolean} verbose Whether to print debug information.
 */
function esbuild(tsFile, bundleFile, minify, watch, verbose) {
  const options = (
    (minify ? "--minify" : "") +
    " " +
    (watch ? "--watch --sourcemap" : "")
  ).trim();
  const command = `npx esbuild ${tsFile} --bundle ${options} --outfile=${bundleFile}`;

  if (verbose) {
    console.log(`> ${command}`);
  }

  const stdio = (error, stdout, stderr) => {
    if (error) {
      console.error(error);
    } else if (stderr) {
      console.error(stdout);
    } else if (stdout) {
      if (verbose) {
        console.log(stdout);
      }
    }
  };

  if (watch) {
    exec(command, stdio);
  } else {
    // Todo: ESBuild doesn't check typescript types apparently, so I should be
    // running tsc -noEmit to make sure it can compile correctly?
    // execSync(`npx tsc -noEmit ${tsFile}`, stdio);

    execSync(command, stdio);
  }
}

/**
 * Deletes and recreates the output folder.
 * @param {string} outputFolder The path of the output folder.
 */
function resetFolder(outputFolder) {
  if (existsSync(outputFolder)) {
    rmSync(outputFolder, { recursive: true });
  }
  mkdirSync(outputFolder, { recursive: true });
}
