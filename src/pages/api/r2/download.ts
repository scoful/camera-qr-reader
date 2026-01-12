import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";
import type { NextApiRequest, NextApiResponse } from "next";

// Initialize S3 Client (Same config as presign.ts)
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { key } = req.query;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ message: "Missing or invalid 'key' parameter" });
  }

  try {
    let signedUrl = "";

    // Check if Custom Domain is configured for public access
    if (env.R2_PUBLIC_DOMAIN) {
      const baseUrl = env.R2_PUBLIC_DOMAIN.startsWith("http")
        ? env.R2_PUBLIC_DOMAIN
        : `https://${env.R2_PUBLIC_DOMAIN}`;
      signedUrl = `${baseUrl}/${key}`;
      // If using custom domain, we might perform a 301/302 redirect directly
      // or just 307 to preserve method if needed, but here it's GET.
    } else {
      // Expires in 5 minutes (300s) - sufficient for immediate scanning
      const command = new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      });
      signedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });
    }

    // Redirect the user to the R2 URL
    return res.redirect(307, signedUrl);

  } catch (error) {
    console.error("Download Redirect Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
