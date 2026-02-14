import type { Html5QrcodeResult } from "html5-qrcode";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ScanHistoryItem } from "@/types";
import { extractR2Key, extractUrl } from "@/utils/url";

export function useScanHistory() {
	const t = useTranslations("Index");
	const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [scannerKey, setScannerKey] = useState(0);

	const handleScanSuccess = async (
		decodedText: string,
		_decodedResult: Html5QrcodeResult,
	) => {
		// Check if scanned content is a short link from this app
		const shortCodeMatch = decodedText.match(/\/s\/([A-Za-z0-9]{4,20})$/);
		if (shortCodeMatch) {
			try {
				const code = shortCodeMatch[1];
				const res = await fetch(`/api/shorten?code=${code}`);
				if (res.ok) {
					const data = await res.json();
					const resolvedText = data.content as string;
					const resolvedUrlValue = extractUrl(resolvedText);
					const resolvedIsUrl = resolvedUrlValue !== null;

					const newItem: ScanHistoryItem = {
						id: Date.now().toString(),
						content: resolvedText,
						timestamp: new Date(),
						isUrl: resolvedIsUrl,
						extractedUrl: resolvedUrlValue ?? undefined,
						shortCodeUrl: decodedText,
					};
					setScanHistory((prev) => [newItem, ...prev]);
					setIsScanning(false);
					toast.success(t("shortCodeResolved"));
					return;
				}
			} catch (err) {
				console.error("Failed to resolve short link:", err);
			}
		}

		const extractedUrlValue = extractUrl(decodedText);
		const itemIsUrl = extractedUrlValue !== null;
		let isR2Image = false;
		let r2Key: string | undefined;

		if (itemIsUrl && extractedUrlValue) {
			const extractedKey = extractR2Key(extractedUrlValue);
			if (extractedKey) {
				r2Key = extractedKey;
				try {
					const response = await fetch(extractedUrlValue, {
						method: "HEAD",
					});
					if (response.ok) {
						const contentType = response.headers.get("Content-Type");
						isR2Image = contentType
							? contentType.startsWith("image/")
							: false;
					}
				} catch (err) {
					console.error("Failed to detect R2 file type:", err);
				}
			}
		}

		const newItem: ScanHistoryItem = {
			id: Date.now().toString(),
			content: decodedText,
			timestamp: new Date(),
			isUrl: itemIsUrl,
			extractedUrl: extractedUrlValue ?? undefined,
			isR2Image,
			r2Key,
		};
		setScanHistory((prev) => [newItem, ...prev]);
		setIsScanning(false);
	};

	const handleScannerReady = () => setIsScanning(true);

	const restartScanner = () => {
		setScannerKey((prev) => prev + 1);
		setIsScanning(true);
	};

	const clearHistory = () => setScanHistory([]);

	return {
		scanHistory,
		isScanning,
		setIsScanning,
		scannerKey,
		handleScanSuccess,
		handleScannerReady,
		restartScanner,
		clearHistory,
	};
}
