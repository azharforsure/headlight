export const INDUSTRIES = [
	"ecommerce",
	"saas",
	"blog",
	"news",
	"finance",
	"education",
	"healthcare",
	"local",
	"jobBoard",
	"realEstate",
	"restaurant",
	"portfolio",
	"media",
	"government",
	"nonprofit",
	"general",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABEL: Record<Industry, string> = {
	ecommerce: "E-commerce",
	saas: "SaaS",
	blog: "Blog",
	news: "News",
	finance: "Finance",
	education: "Education",
	healthcare: "Healthcare",
	local: "Local business",
	jobBoard: "Job board",
	realEstate: "Real estate",
	restaurant: "Restaurant",
	portfolio: "Portfolio",
	media: "Media",
	government: "Government",
	nonprofit: "Nonprofit",
	general: "General",
};
