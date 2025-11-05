import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	root: __dirname,
	build: {
		outDir: "dist",
		rollupOptions: {
			input: resolve(__dirname, "index.html"),
		},
	},
});
