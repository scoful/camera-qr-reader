import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env";

// Initialize S3 Client (Same config as presign.ts)
const S3 = new S3Client({
	region: "auto",
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "GET") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	const { key } = req.query;

	if (!key || typeof key !== "string") {
		return res
			.status(400)
			.json({ message: "Missing or invalid 'key' parameter" });
	}

	try {
		// Fetch the file from R2 and stream it to the client with download headers
		const command = new GetObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
		});

		const response = await S3.send(command);

		if (!response.Body) {
			return res.status(404).json({ message: "File not found" });
		}

		// Set headers for file download
		const contentType = response.ContentType || "application/octet-stream";
		const filename = key.split("/").pop() || "download";

		res.setHeader("Content-Type", contentType);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${encodeURIComponent(filename)}"`,
		);
		if (response.ContentLength) {
			res.setHeader("Content-Length", response.ContentLength.toString());
		}

		// Stream the file content to the response
		const stream = response.Body as NodeJS.ReadableStream;
		stream.pipe(res);
	} catch (error) {
		console.error("Download Error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}
