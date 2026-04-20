export type Locale = `${string}-${string}`; // e.g. "en-US"
export type Hreflang = Locale | "x-default";

export interface Market {
	country: string; // ISO-3166-1 alpha-2
	language: string; // ISO-639-1
	currency?: string; // ISO-4217
}
