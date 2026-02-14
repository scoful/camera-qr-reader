import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { env } from "@/env";
import { createShortLink, resolveShortLink } from "@/lib/kv";

const createSchema = z.object({
	content: z.string().min(1).max(10000),
});

const resolveSchema = z.object({
	code: z.string().min(1).max(20),
});

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method === "POST") {
		// Create short link — requires password
		if (env.ACCESS_PASSWORD) {
			const authHeader = req.headers["x-access-password"];
			if (authHeader !== env.ACCESS_PASSWORD) {
				return res
					.status(401)
					.json({ message: "Unauthorized: Invalid Password" });
			}
		}

		try {
			const { content } = createSchema.parse(req.body);
			const code = await createShortLink(content);

			// Build short URL using request host
			const protocol = req.headers["x-forwarded-proto"] || "https";
			const host = req.headers.host;
			const shortUrl = `${protocol}://${host}/s/${code}`;

			return res.status(200).json({ code, shortUrl });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid parameters", errors: error.errors });
			}
			console.error("Shorten create error:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	if (req.method === "GET") {
		// Resolve short link — no password needed
		try {
			const { code } = resolveSchema.parse(req.query);
			const data = await resolveShortLink(code);

			if (!data) {
				return res.status(404).json({ message: "Short link not found" });
			}

			return res.status(200).json(data);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid parameters", errors: error.errors });
			}
			console.error("Shorten resolve error:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	}

	return res.status(405).json({ message: "Method not allowed" });
}
