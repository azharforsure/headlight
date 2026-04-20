export interface ChartPoint {
	t: string; // ISO time
	v: number;
	v2?: number;
	v3?: number;
	label?: string;
}

export interface ChartSeries {
	id: string;
	name: string;
	unit?: string;
	points: ReadonlyArray<ChartPoint>;
}

export interface ChartBand {
	from: number;
	to: number;
	label: string;
	tone: "good" | "warn" | "bad" | "neutral";
}
