import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const loadedEnv = loadEnv(mode, process.cwd(), "");
	const apiUrl = loadedEnv.VITE_API_URL || process.env.VITE_API_URL || "http://localhost:3001";

	return {
		plugins: [
			tsconfigPaths({ projects: ["./tsconfig.json"] }),
			tailwindcss(),
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
				routesDirectory: "./src/routes",
				generatedRouteTree: "./src/routeTree.gen.ts",
				routeFileIgnorePattern: "^(_components|_libs|__tests__)"
			}),
			viteReact()
		],
		resolve: {
			alias: {
				"@": new URL("./src", import.meta.url).pathname
			}
		},
		server: {
			host: true,
			port: 5173,
			proxy: {
				"/rpc": { target: apiUrl, changeOrigin: true },
				"/api": { target: apiUrl, changeOrigin: true }
			}
		}
	};
});
