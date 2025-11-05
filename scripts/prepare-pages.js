import {
	existsSync,
	rmSync,
	statSync,
	mkdirSync,
	readdirSync,
	copyFileSync,
} from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

// build a clean 'publish' dir containing only the static assets to publish
const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), "..");
const outDir = join(root, "publish");

const exclude = new Set([
	"node_modules",
	".git",
	"publish",
	"scripts",
	".github",
	".vscode",
]);

function removeDir(p) {
	if (existsSync(p)) {
		rmSync(p, { recursive: true, force: true });
	}
}

function copyRecursive(src, dest) {
	const stat = statSync(src);
	if (stat.isDirectory()) {
		mkdirSync(dest, { recursive: true });
		for (const child of readdirSync(src)) {
			if (exclude.has(child)) continue;
			copyRecursive(join(src, child), join(dest, child));
		}
	} else if (stat.isFile()) {
		mkdirSync(dirname(dest), { recursive: true });
		copyFileSync(src, dest);
	}
}

function build() {
	console.log("Preparing publish/ folder...");
	removeDir(outDir);
	mkdirSync(outDir, { recursive: true });
	// copy everything except excluded entries
	for (const entry of readdirSync(root)) {
		if (exclude.has(entry)) continue;
		// skip package.json and node-based artifacts
		if (["package.json", "package-lock.json", "yarn.lock"].includes(entry))
			continue;
		copyRecursive(join(root, entry), join(outDir, entry));
	}
	console.log("publish/ is ready — contains:");
	console.log(readdirSync(outDir).join("\n"));
}

try {
	build();
} catch (err) {
	console.error("Failed to prepare publish folder:", err);
	process.exit(1);
}
