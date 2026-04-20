import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../config/src/vitest";

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ["test/**/*.test.ts"],
		},
	}),
);
