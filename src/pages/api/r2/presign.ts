import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
	DOWNLOAD_URL_EXPIRATION,
	MAX_UPLOAD_SIZE,
	UPLOAD_URL_EXPIRATION,
} from "@/config/constants";
import { env } from "@/env";

// Initialize S3 Client
const S3 = new S3Client({
	region: "auto",
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

// Validation Schemas
const querySchema = z.object({
	action: z.enum(["put", "get", "verify"]),
	key: z.string().min(1),
	contentType: z.string().optional(),
	size: z.number().optional(),
});

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	try {
		// Validate request body
		const { action, key, contentType, size } = querySchema.parse(req.body);

		// Auth Check (Skip for 'get' action to allow public downloads via shared links)
		if (action !== "get" && env.ACCESS_PASSWORD) {
			const authHeader = req.headers["x-access-password"];
			if (authHeader !== env.ACCESS_PASSWORD) {
				return res
					.status(401)
					.json({ message: "Unauthorized: Invalid Password" });
			}
		}

		if (action === "verify") {
			return res.status(200).json({ status: "ok" });
		}

		let signedUrl = "";

		if (action === "put") {
			// Validate size (Strict: Must be present for PUT)
			if (!size) {
				return res
					.status(400)
					.json({ message: "File size is required for upload" });
			}
			if (size > MAX_UPLOAD_SIZE) {
				return res.status(400).json({
					message: `File size exceeds limit of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
				});
			}

			// 1. Generate Upload URL (Presigned PUT)
			// Use timestamp as key, append extension if present
			const timestamp = Date.now();
			const ext = key.includes(".") ? key.substring(key.lastIndexOf(".")) : "";
			const finalKey = `${timestamp}${ext}`;

			// Expire in 5 minutes (300 seconds)
			const command = new PutObjectCommand({
				Bucket: env.R2_BUCKET_NAME,
				Key: finalKey,
				ContentType: contentType || "application/octet-stream",
			});
			signedUrl = await getSignedUrl(S3, command, {
				expiresIn: UPLOAD_URL_EXPIRATION,
			});

			// Return the modified key so the client knows what to request later
			return res.status(200).json({ url: signedUrl, key: finalKey });
		} else if (action === "get") {
			// 2. Generate Download URL (Presigned GET)
			// Expire in 5 minutes (300 seconds) - same as upload

			if (env.R2_PUBLIC_DOMAIN) {
				// If Custom Domain is set, use it directly
				const baseUrl = env.R2_PUBLIC_DOMAIN.startsWith("http")
					? env.R2_PUBLIC_DOMAIN
					: `https://${env.R2_PUBLIC_DOMAIN}`;
				signedUrl = `${baseUrl}/${key}`;
			} else {
				// Standard R2 Presigned Download
				const command = new GetObjectCommand({
					Bucket: env.R2_BUCKET_NAME,
					Key: key,
				});
				signedUrl = await getSignedUrl(S3, command, {
					expiresIn: DOWNLOAD_URL_EXPIRATION,
				});
			}
		}

		return res.status(200).json({ url: signedUrl, key });
	} catch (error) {
		console.error("Presign Error:", error);
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Invalid parameters", errors: error.errors });
		}
		return res.status(500).json({ message: "Internal server error" });
	}
}
