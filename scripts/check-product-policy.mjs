import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const errors = [];
const prohibitedDependencies = [
  /^firebase$/,
  /^@firebase\//,
  /^@sentry\//,
  /sentry-expo/,
  /amplitude/,
  /mixpanel/,
  /appsflyer/,
  /^adjust-/,
  /admob/,
  /facebook.*sdk/,
  /^expo-notifications$/,
  /^expo-camera$/,
  /^expo-location$/,
  /^expo-contacts$/,
  /^expo-image-picker$/,
  /^react-native-permissions$/,
  /^axios$/,
];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".git", "dist", ".expo", "coverage"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else files.push(target);
  }
  return files;
}

for (const file of walk(root).filter((value) => path.basename(value) === "package.json")) {
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const fields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  for (const field of fields) {
    for (const dependency of Object.keys(pkg[field] ?? {})) {
      if (prohibitedDependencies.some((pattern) => pattern.test(dependency))) {
        errors.push(`${path.relative(root, file)}: prohibited dependency ${dependency}`);
      }
    }
  }
}

const sourceRoots = [path.join(root, "apps"), path.join(root, "packages")];
const sourceFiles = sourceRoots
  .filter((directory) => fs.existsSync(directory))
  .flatMap(walk)
  .filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file));

const prohibitedSourcePatterns = [
  { pattern: /\bfetch\s*\(/, label: "network fetch" },
  { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
  { pattern: /\bWebSocket\b/, label: "WebSocket" },
  { pattern: /https?:\/\//, label: "remote URL in product source" },
];

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const sourceWithoutStaticNamespaces = source.replaceAll(
    "http://www.w3.org/2000/svg",
    "",
  );
  const relative = path.relative(root, file);
  for (const rule of prohibitedSourcePatterns) {
    if (rule.pattern.test(sourceWithoutStaticNamespaces)) {
      errors.push(`${relative}: ${rule.label} violates offline-first v1`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Product policy check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Product policy check passed across ${sourceFiles.length} source files.`);
