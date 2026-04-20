import type { HostString, Sha256, UrlString } from "./primitives";

export interface SiteFingerprint {
	host: HostString;
	cms?: string; // "wordpress" | "shopify" | "webflow" | ...
	framework?: string; // "next" | "astro" | "remix" | ...
	server?: string; // "cloudflare" | "vercel" | "nginx" | ...
	analytics: ReadonlyArray<string>;
	tagManagers: ReadonlyArray<string>;
	schemaTypes: ReadonlyArray<string>;
	languages: ReadonlyArray<string>;
	hashedAt: string; // ISO
}

export interface PageFingerprint {
	url: UrlString;
	domHash: Sha256;
	textHash: Sha256;
	templateId?: TemplateId;
	title?: string;
	h1?: string;
	canonical?: UrlString;
	noindex: boolean;
	byteSize: number;
	renderedAt: string; // ISO
}

export type TemplateId = `tpl_${string}`;

export interface TemplateFingerprint {
	id: TemplateId;
	exemplarUrl: UrlString;
	sampleCount: number;
	domSignature: Sha256;
	kind: "product" | "category" | "article" | "landing" | "home" | "utility" | "other";
}
