export const MODES = [
	"fullAudit",
	"wqa",
	"technical",
	"content",
	"linksAuthority",
	"uxConversion",
	"paid",
	"commerce",
	"socialBrand",
	"ai",
	"competitors",
	"local",
] as const;

export type Mode = (typeof MODES)[number];

export const MODE_ACCENT: Record<Mode, string> = {
	fullAudit: "slate",
	wqa: "violet",
	technical: "blue",
	content: "amber",
	linksAuthority: "teal",
	uxConversion: "rose",
	paid: "cyan",
	commerce: "green",
	socialBrand: "indigo",
	ai: "fuchsia",
	competitors: "red",
	local: "orange",
};

export const MODE_LABEL: Record<Mode, string> = {
	fullAudit: "Full audit",
	wqa: "Web quality",
	technical: "Technical",
	content: "Content",
	linksAuthority: "Links & authority",
	uxConversion: "UX & conversion",
	paid: "Paid",
	commerce: "Commerce",
	socialBrand: "Social & brand",
	ai: "AI & answer engines",
	competitors: "Competitors",
	local: "Local",
};
