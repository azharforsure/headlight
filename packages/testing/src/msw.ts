import { setupServer } from "msw/node";
import { http, HttpResponse, type DefaultBodyType, type HttpHandler } from "msw";

export const baseHandlers: HttpHandler[] = [
	http.get("*/api/health", () => HttpResponse.json({ ok: true }))
];

export const server = setupServer(...baseHandlers);

export function withHandlers(...handlers: HttpHandler[]) {
	server.use(...handlers);
}

export function mockJson<T extends DefaultBodyType>(url: string, body: T, status = 200) {
	return http.get(url, () => HttpResponse.json(body, { status }));
}

export { http, HttpResponse };
