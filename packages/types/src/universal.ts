export type Result<T, E = Error> =
	| { ok: true; value: T }
	| { ok: false; error: E };

export interface Paginated<T> {
	items: ReadonlyArray<T>;
	nextCursor?: string;
	total?: number;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type Nullable<T> = T | null;
export type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };
