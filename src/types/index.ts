export interface ScanHistoryItem {
	id: string;
	content: string;
	timestamp: Date;
	isUrl: boolean;
	extractedUrl?: string;
	isR2Image?: boolean;
	r2Key?: string;
	shortCodeUrl?: string;
}
