import { env } from "@/env";

const URL_PATTERN =
	/https?:\/\/[^\s\n\r\t<>"{}|\\^\x60[\]\uff0c\u3002\uff01\uff1f\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\u3010\u3011\uff08\uff09]+/gi;

export function extractAllUrls(text: string): string[] {
	const matches = text.match(URL_PATTERN);
	if (matches && matches.length > 0) {
		return matches.map((url) => url.replace(/[.,;:!?)]+$/, ""));
	}
	return [];
}

export function extractUrl(text: string): string | null {
	const urls = extractAllUrls(text);
	return urls[0] ?? null;
}

export function extractR2Key(url: string): string | null {
	const R2_DOMAIN = env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
	if (!R2_DOMAIN) return null;
	try {
		const urlObj = new URL(url);
		if (urlObj.hostname === R2_DOMAIN) {
			return urlObj.pathname.slice(1);
		}
	} catch {
		// Not a valid URL
	}
	return null;
}

export function getR2PublicUrl(key: string): string {
	const publicDomain = env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
	if (!publicDomain) throw new Error("R2 public domain not configured");
	const baseUrl = publicDomain.startsWith("http")
		? publicDomain
		: `https://${publicDomain}`;
	return `${baseUrl}/${key}`;
}
