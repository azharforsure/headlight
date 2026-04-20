// packages/types/test/smoke.test.ts
import { describe, it, expect } from "vitest";
import { MODES, INDUSTRIES, METRIC_ROLES, SOURCE_TIERS, FRESHNESS, SEVERITY_BANDS } from "../src/index";
import { METRIC_NAMESPACES } from "../src/metrics/index";
import { ACTION_CODES } from "../src/actions";

describe("@headlight/types catalogs", () => {
	it("has 12 modes", () => expect(MODES.length).toBe(12));
	it("has 16 industries", () => expect(INDUSTRIES.length).toBe(16));
	it("has 13 metric roles", () => expect(METRIC_ROLES.length).toBe(13));
	it("has 9 source tiers", () => expect(SOURCE_TIERS.length).toBe(9));
	it("has 6 freshness tags", () => expect(FRESHNESS.length).toBe(6));
	it("has 5 severity bands", () => expect(SEVERITY_BANDS.length).toBe(5));
	it("has 12 metric namespaces", () => expect(METRIC_NAMESPACES.length).toBe(12));
	it("has 76 action codes", () => expect(ACTION_CODES.length).toBe(76));
	it("all action codes are unique", () => expect(new Set(ACTION_CODES).size).toBe(ACTION_CODES.length));
});
