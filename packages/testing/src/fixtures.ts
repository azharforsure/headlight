import { randomUUID } from "node:crypto";

export interface WorkspaceFixture {
	id: string;
	name: string;
	createdAt: string;
}

export function workspace(overrides: Partial<WorkspaceFixture> = {}): WorkspaceFixture {
	return {
		id: randomUUID(),
		name: "Acme",
		createdAt: new Date("2026-04-18T00:00:00Z").toISOString(),
		...overrides
	};
}

export interface PageFixture {
	url: string;
	title: string;
	status: number;
	wordCount: number;
}

export function page(overrides: Partial<PageFixture> = {}): PageFixture {
	return {
		url: "https://acme.com/",
		title: "Acme",
		status: 200,
		wordCount: 420,
		...overrides
	};
}

export function list<T>(make: () => T, count: number): T[] {
	return Array.from({ length: count }, make);
}
