import {
	Check,
	Copy,
	History,
	Image as ImageIcon,
	Link as LinkIcon,
	Shrink,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ScanHistoryItem } from "@/types";
import { extractAllUrls } from "@/utils/url";

interface ScanHistoryProps {
	items: ScanHistoryItem[];
	onClear: () => void;
}

export default function ScanHistory({ items, onClear }: ScanHistoryProps) {
	const t = useTranslations("Index");
	const router = useRouter();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopyItem = async (content: string, id: string) => {
		try {
			await navigator.clipboard.writeText(content);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch (err) {
			console.error("Failed to copy", err);
		}
	};

	const renderContentWithUrl = (content: string) => {
		const urls = extractAllUrls(content);

		if (urls.length === 0) {
			return (
				<p className="break-all font-medium text-slate-800 text-sm leading-relaxed">
					{content}
				</p>
			);
		}

		const segments: { type: "text" | "url"; content: string }[] = [];
		let remaining = content;

		for (const url of urls) {
			const urlIndex = remaining.indexOf(url);
			if (urlIndex === -1) continue;

			if (urlIndex > 0) {
				segments.push({
					type: "text",
					content: remaining.substring(0, urlIndex),
				});
			}
			segments.push({ type: "url", content: url });
			remaining = remaining.substring(urlIndex + url.length);
		}
		if (remaining) {
			segments.push({ type: "text", content: remaining });
		}

		return (
			<p className="break-all font-medium text-sm leading-relaxed">
				{segments.map((seg) =>
					seg.type === "url" ? (
						<a
							className="text-indigo-600 hover:underline"
							href={seg.content}
							key={`url-${seg.content}`}
							rel="noopener noreferrer"
							target="_blank"
						>
							{seg.content}
						</a>
					) : (
						<span
							className="text-slate-800"
							key={`text-${seg.content.slice(0, 20)}`}
						>
							{seg.content}
						</span>
					),
				)}
			</p>
		);
	};

	return (
		<div className="flex flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-indigo-100/50 shadow-xl backdrop-blur-xl">
			<div className="flex items-center justify-between border-slate-100 border-b bg-white/30 px-6 py-4 backdrop-blur-md">
				<h3 className="flex items-center gap-2 font-bold text-lg text-slate-800">
					<History className="h-5 w-5 text-indigo-500" />
					{t("historyTitle")}
				</h3>
				{items.length > 0 && (
					<button
						className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-500 text-xs hover:bg-rose-50"
						onClick={onClear}
						type="button"
					>
						<Trash2 className="h-3.5 w-3.5" />
						{t("clearHistory")}
					</button>
				)}
			</div>
			<div className="custom-scrollbar max-h-[600px] flex-1 overflow-y-auto p-4">
				{items.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center py-20 text-center text-slate-400">
						<History className="mb-3 h-12 w-12 text-slate-200" />
						<p className="text-sm">{t("noHistory")}</p>
					</div>
				) : (
					<div className="space-y-3">
						{items.map((item) => (
							<div
								className="group relative flex flex-col gap-3 rounded-xl border border-white bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md"
								key={item.id}
							>
								<div>
									<div className="mb-1 flex items-center justify-between">
										<span className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
											{item.isUrl ? t("typeLink") : t("typeText")}
										</span>
										<span className="text-[10px] text-slate-400">
											{item.timestamp.toLocaleTimeString()}
										</span>
									</div>
									{renderContentWithUrl(item.content)}
									{item.shortCodeUrl && (
										<p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-slate-400">
											<Shrink className="h-3 w-3" />
											{item.shortCodeUrl}
										</p>
									)}
								</div>
								<div className="flex items-center justify-end gap-2 border-slate-100 border-t pt-2 opacity-0 transition-opacity group-hover:opacity-100">
									<button
										className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-xs transition-colors ${
											copiedId === item.id
												? "bg-teal-50 text-teal-600"
												: "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
										}`}
										onClick={() =>
											handleCopyItem(item.content, item.id)
										}
										type="button"
									>
										{copiedId === item.id ? (
											<>
												<Check className="h-3 w-3" /> {t("copied")}
											</>
										) : (
											<>
												<Copy className="h-3 w-3" /> {t("copy")}
											</>
										)}
									</button>
									{item.isUrl && item.extractedUrl && (
										<a
											className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 font-bold text-indigo-600 text-xs transition-colors hover:bg-indigo-100"
											href={item.extractedUrl}
											rel="noopener noreferrer"
											target="_blank"
										>
											<LinkIcon className="h-3 w-3" />
											{t("open")}
										</a>
									)}
									{item.isR2Image && item.r2Key && (
										<a
											className="flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-1 font-bold text-purple-600 text-xs transition-colors hover:bg-purple-100"
											href={`${router.locale && router.locale !== router.defaultLocale ? `/${router.locale}` : ""}/download?key=${encodeURIComponent(item.r2Key)}`}
											rel="noopener noreferrer"
											target="_blank"
										>
											<ImageIcon className="h-3 w-3" />
											{t("editImage")}
										</a>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
