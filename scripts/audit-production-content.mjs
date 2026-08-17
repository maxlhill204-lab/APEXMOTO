import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const productionRoots = ["src", "public"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".css", ".md", ".svg", ".txt"]);
const forbidden = [
  [/Australia['’]s #1/gi, "unsubstantiated #1 claim"],
  [/thousands sold/gi, "unsubstantiated sales count"],
  [/trusted by professional racers/gi, "unsubstantiated professional endorsement"],
  [/lorem ipsum/gi, "lorem ipsum"],
  [/DEMO REVIEW/gi, "demonstration review"],
  [/aggregateRating/gi, "review/rating structured data"],
  [/(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{12,}/g, "Stripe key-like value"],
  [/whsec_[A-Za-z0-9]{12,}/g, "Stripe webhook secret-like value"],
  [/console\.log\s*\(/g, "console.log in production source"],
  [/\bTEST_[A-Z0-9_]+\b/g, "test fixture name outside tests"],
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (textExtensions.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

const findings = [];
for (const productionRoot of productionRoots) {
  for (const file of await filesUnder(join(root, productionRoot))) {
    const text = await readFile(file, "utf8");
    for (const [pattern, label] of forbidden) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) findings.push(`${relative(root, file)}: ${label}`);
    }
  }
}

if (findings.length) {
  console.error("Production content audit failed:\n" + findings.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.info("Production content audit passed: no forbidden fake-data, rating, test-fixture, console, or key patterns found.");
}
