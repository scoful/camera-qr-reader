import {
	Download,
	Image as ImageIcon,
	Loader2,
	Moon,
	RotateCw,
	Sun,
} from "lucide-react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";

export default function DownloadPage() {
	const t = useTranslations("Download");
	const router = useRouter();
	const { key } = router.query;
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Editor State
	const [rotation, setRotation] = useState(0);
	const [invert, setInvert] = useState(false);
	const [grayscale, setGrayscale] = useState(false);
	const [isZoomed, setIsZoomed] = useState(false);

	// Refs
	const imageRef = useRef<HTMLImageElement>(null);
	const zoomModalRef = useRef<HTMLDivElement>(null);

	// Lock body scroll when zoomed
	useEffect(() => {
		if (isZoomed) {
			document.body.style.overflow = "hidden";
			// Focus modal for keyboard events
			zoomModalRef.current?.focus();
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isZoomed]);

	// Load Image URL
	useEffect(() => {
		if (!router.isReady || !key) return;

		const fetchUrl = async () => {
			try {
				// Optimization: If R2 public domain is configured, construct URL directly
				const publicDomain = env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
				if (publicDomain) {
					const baseUrl = publicDomain.startsWith("http")
						? publicDomain
						: `https://${publicDomain}`;
					setImageUrl(`${baseUrl}/${key}`);
					setLoading(false);
					return;
				}

				// Fallback: Use presign API for R2 signed URL
				const res = await fetch("/api/r2/presign", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "get", key: key as string }),
				});

				if (!res.ok) throw new Error(t("expiredError"));
				const data = await res.json();
				setImageUrl(data.url);
			} catch (_err) {
				setError(t("loadError"));
			} finally {
				setLoading(false);
			}
		};

		fetchUrl();
	}, [router.isReady, key, t]);

	// Filter Styles for Preview
	const filterStyle = {
		transform: `rotate(${rotation}deg)`,
		filter:
			`${invert ? "invert(1)" : ""} ${grayscale ? "grayscale(1)" : ""}`.trim(),
		transition: "all 0.3s ease",
	};

	// Save Edited Image
	const handleSaveEdited = async () => {
		if (!imageUrl || !imageRef.current) return;

		try {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const img = new Image();
			img.crossOrigin = "anonymous"; // Try to request CORS access
			img.src = imageUrl;

			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = () => reject(new Error("CORS or Load Error"));
			});

			// Calculate canvas dimensions based on rotation
			const isVertical = rotation % 180 !== 0;
			canvas.width = isVertical ? img.height : img.width;
			canvas.height = isVertical ? img.width : img.height;

			// Apply Filters
			ctx.filter =
				`${invert ? "invert(1)" : ""} ${grayscale ? "grayscale(1)" : ""}`.trim();

			// Apply Rotation
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate((rotation * Math.PI) / 180);
			ctx.drawImage(img, -img.width / 2, -img.height / 2);

			// Download
			const link = document.createElement("a");
			link.download = `edited-${key}`;
			link.href = canvas.toDataURL("image/png");
			link.click();
			toast.success(t("saveSuccess"));
		} catch (err) {
			console.error(err);
			toast.error(t("saveError"));
		}
	};

	const handleRotate = () => setRotation((prev) => prev + 90);

	// Download Original Image (via Custom Domain + Transform Rule)
	const handleDownloadOriginal = () => {
		if (!imageUrl) return;
		// Add download=true param to trigger Cloudflare Transform Rule
		const downloadUrl = imageUrl.includes("?")
			? `${imageUrl}&download=true`
			: `${imageUrl}?download=true`;
		window.location.href = downloadUrl;
	};

	if (loading) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-slate-50">
				<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 p-4">
				<div className="text-slate-400">
					<ImageIcon className="h-16 w-16" />
				</div>
				<h1 className="font-bold text-slate-800 text-xl">{error}</h1>
				<button
					className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
					onClick={() => router.reload()}
					type="button"
				>
					{t("retry")}
				</button>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>{t("title")}</title>
			</Head>
			<div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 md:p-8">
				{/* Image Container */}
				<button
					className="group relative flex w-full max-w-5xl flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-950/50 shadow-2xl backdrop-blur-sm transition-transform active:scale-[0.99]"
					onClick={() => setIsZoomed(true)}
					type="button"
				>
					{/* Grid Background Pattern */}
					<div
						className="absolute inset-0 opacity-20"
						style={{
							backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
							backgroundSize: "24px 24px",
						}}
					/>

					{/* Zoom hint icon - only visible on hover */}
					<div className="pointer-events-none absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
						<ImageIcon className="h-5 w-5" />
					</div>

					{/* biome-ignore lint/performance/noImgElement: Need native img for Canvas operations and CSS filters */}
					<img
						alt="Preview"
						className="relative z-10 max-h-[70vh] max-w-full object-contain shadow-2xl"
						crossOrigin="anonymous"
						ref={imageRef}
						src={imageUrl || ""}
						style={filterStyle}
					/>
				</button>

				{/* Zoom Modal (Lightbox) */}
				{isZoomed && (
					// biome-ignore lint/a11y/useSemanticElements: Modal overlay with scroll support
					<div
						className="fade-in fixed inset-0 z-50 animate-in cursor-zoom-out overflow-auto bg-black/95 backdrop-blur-md duration-200"
						onClick={() => setIsZoomed(false)}
						onKeyDown={(e) => e.key === "Escape" && setIsZoomed(false)}
						ref={zoomModalRef}
						role="button"
						tabIndex={0}
					>
						<div className="flex min-h-full w-full items-center justify-center p-4">
							{/* biome-ignore lint/performance/noImgElement: Need native img for CSS filters */}
							<img
								alt="Zoomed Preview"
								className="max-w-[95vw] object-contain shadow-2xl transition-all duration-300"
								crossOrigin="anonymous"
								src={imageUrl || ""}
								style={filterStyle}
							/>
						</div>
					</div>
				)}

				{/* Toolbar */}
				<div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl backdrop-blur-md">
					{/* Rotate */}
					<button
						className="group flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition-all hover:bg-indigo-600 hover:text-white"
						onClick={handleRotate}
						title={t("rotateTitle")}
						type="button"
					>
						<RotateCw className="h-5 w-5 transition-transform group-hover:rotate-90" />
					</button>

					{/* Invert */}
					<button
						className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
							invert
								? "bg-indigo-600 text-white shadow-indigo-500/30 shadow-lg"
								: "bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white"
						}`}
						onClick={() => setInvert(!invert)}
						title={t("invertTitle")}
						type="button"
					>
						{invert ? (
							<Moon className="h-5 w-5" />
						) : (
							<Sun className="h-5 w-5" />
						)}
					</button>

					{/* Grayscale */}
					<button
						className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
							grayscale
								? "bg-indigo-600 text-white shadow-indigo-500/30 shadow-lg"
								: "bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white"
						}`}
						onClick={() => setGrayscale(!grayscale)}
						title={t("grayscaleTitle")}
						type="button"
					>
						<span className="font-bold text-sm">{t("grayscaleLabel")}</span>
					</button>

					<div className="mx-2 h-8 w-px bg-slate-700" />

					{/* Download Original */}
					<button
						className="flex items-center gap-2 rounded-xl border border-slate-700 bg-transparent px-4 py-3 font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800"
						onClick={handleDownloadOriginal}
						type="button"
					>
						<Download className="h-4 w-4" />
						{t("downloadOriginal")}
					</button>

					{/* Save Edited */}
					<button
						className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-indigo-500/20 shadow-lg transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95"
						onClick={handleSaveEdited}
						type="button"
					>
						<Download className="h-4 w-4" />
						{t("saveEdited")}
					</button>
				</div>
			</div>
		</>
	);
}

// Minimal i18n setup similar to index page
export const getServerSideProps: GetServerSideProps = async (context) => {
	return {
		props: {
			messages: (await import(`../../messages/${context.locale || "en"}.json`))
				.default,
		},
	};
};
