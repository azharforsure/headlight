// Branded primitives — never use raw string for identifiers.

declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type WorkspaceId = Brand<string, "WorkspaceId">;
export type BusinessId = Brand<string, "BusinessId">;
export type ProjectId = Brand<string, "ProjectId">;
export type UserId = Brand<string, "UserId">;
export type AgentId = Brand<string, "AgentId">;
export type RunId = Brand<string, "RunId">;
export type PageId = Brand<string, "PageId">;
export type KeywordId = Brand<string, "KeywordId">;
export type LinkId = Brand<string, "LinkId">;
export type CompetitorId = Brand<string, "CompetitorId">;
export type TaskId = Brand<string, "TaskId">;
export type ReportId = Brand<string, "ReportId">;
export type MetricId = Brand<string, "MetricId">;
export type ActionId = Brand<string, "ActionId">;

// Stringly-typed but meaningfully branded values.
export type Iso8601 = Brand<string, "Iso8601">;
export type UrlString = Brand<string, "UrlString">;
export type HostString = Brand<string, "HostString">;
export type Sha256 = Brand<string, "Sha256">;

export type Percent = Brand<number, "Percent">; // 0..100
export type Ratio = Brand<number, "Ratio">; // 0..1
export type Milliseconds = Brand<number, "Milliseconds">;
export type Bytes = Brand<number, "Bytes">;

// Construction helpers — runtime is a no-op cast; validation lives in `@headlight/utils`.
export const asId = <T extends Brand<string, string>>(v: string): T => v as T;
export const asIso = (v: string): Iso8601 => v as Iso8601;
export const asUrl = (v: string): UrlString => v as UrlString;
