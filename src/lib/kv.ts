import { env } from "@/env";

interface ShortLinkData {
	content: string;
	type: "url" | "text";
	createdAt: string;
}

const KV_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function getKvBaseUrl() {
	return `https://api.cloudflare.com/client/v4/accounts/${env.R2_ACCOUNT_ID}/storage/kv/namespaces/${env.CF_KV_NAMESPACE_ID}`;
}

function generateShortCode(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

function isUrl(text: string): boolean {
	return /^https?:\/\//i.test(text.trim());
}

export async function createShortLink(content: string): Promise<string> {
	if (!env.CF_KV_NAMESPACE_ID || !env.CF_KV_API_TOKEN) {
		throw new Error("Cloudflare KV not configured");
	}

	const code = generateShortCode();
	const data: ShortLinkData = {
		content,
		type: isUrl(content.trim()) ? "url" : "text",
		createdAt: new Date().toISOString(),
	};

	const res = await fetch(
		`${getKvBaseUrl()}/values/short:${code}?expiration_ttl=${KV_TTL}`,
		{
			method: "PUT",
			headers: {
				Authorization: `Bearer ${env.CF_KV_API_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		},
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`KV write failed: ${err}`);
	}

	return code;
}

export async function resolveShortLink(
	code: string,
): Promise<ShortLinkData | null> {
	if (!env.CF_KV_NAMESPACE_ID || !env.CF_KV_API_TOKEN) {
		throw new Error("Cloudflare KV not configured");
	}

	const res = await fetch(`${getKvBaseUrl()}/values/short:${code}`, {
		headers: {
			Authorization: `Bearer ${env.CF_KV_API_TOKEN}`,
		},
	});

	if (!res.ok) {
		if (res.status === 404) return null;
		throw new Error(`KV read failed: ${res.statusText}`);
	}

	const data: ShortLinkData = await res.json();
	return data;
}
