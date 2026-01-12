import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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
  action: z.enum(["put", "get"]),
  key: z.string().min(1),
  contentType: z.string().optional(),
  size: z.number().optional(),
});

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Validate request body
    const { action, key, contentType, size } = querySchema.parse(req.body);

    let signedUrl = "";

    if (action === "put") {
      // Validate size
      if (size && size > MAX_SIZE_BYTES) {
        return res
          .status(400)
          .json({ message: `File size exceeds limit of ${MAX_SIZE_BYTES / 1024 / 1024}MB` });
      }

      // 1. Generate Upload URL (Presigned PUT)
      // Expire in 5 minutes (300 seconds)
      const command = new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType || "application/octet-stream",
      });
      signedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });

    } else if (action === "get") {
      // 2. Generate Download URL (Presigned GET)
      // Expire in 1 day (86400 seconds)

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
        signedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });
      }
    }

    return res.status(200).json({ url: signedUrl, key });

  } catch (error) {
    console.error("Presign Error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
