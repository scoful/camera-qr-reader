import type { Html5QrcodeResult } from "html5-qrcode";
import {
	Camera,
	Check,
	Copy,
	Github,
	HelpCircle,
	History,
	Image as ImageIcon,
	Link as LinkIcon,
	Lock,
	QrCode,
	Trash2,
	Upload,
	Wifi,
	X,
	Zap,
} from "lucide-react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QrScanner from "@/components/QrScanner";
import { MAX_UPLOAD_SIZE } from "@/config/constants";
import { env } from "@/env";
import versionInfo from "../../version.json";

interface ScanHistoryItem {
	id: string;
	content: string;
	timestamp: Date;
	isUrl: boolean;
	isR2Image?: boolean; // Whether the URL is an R2 image that can be edited
	r2Key?: string; // The R2 object key extracted from URL
}

export default function Home() {
	const t = useTranslations("Index");
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"scan" | "generate">("scan");
	const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [scannerKey, setScannerKey] = useState(0);
	const [generatedQrValue, setGeneratedQrValue] = useState("");
	const [inputUrl, setInputUrl] = useState("");
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [showHelpModal, setShowHelpModal] = useState(false);
	const [helpTab, setHelpTab] = useState<"guide" | "ios">("guide");

	// Auth State
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const pendingFileRef = useRef<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Lock body scroll when modal is open
	useEffect(() => {
		if (showHelpModal) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [showHelpModal]);

	// Detect URL
	const isUrl = (text: string): boolean => {
		try {
			const url = new URL(text);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	};

	// R2 domain pattern for detecting project-generated URLs
	const R2_DOMAIN = env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

	// Extract R2 key from URL
	const extractR2Key = (url: string): string | null => {
		if (!R2_DOMAIN) return null; // Skip if not configured
		try {
			const urlObj = new URL(url);
			if (urlObj.hostname === R2_DOMAIN) {
				// URL format: https://{R2_DOMAIN}/{key}
				return urlObj.pathname.slice(1); // Remove leading /
			}
		} catch {
			// Not a valid URL
		}
		return null;
	};

	// Check if content type is an image
	const isImageContentType = (contentType: string | null): boolean => {
		if (!contentType) return false;
		return contentType.startsWith("image/");
	};

	const handleScanSuccess = async (
		decodedText: string,
		_decodedResult: Html5QrcodeResult,
	) => {
		const itemIsUrl = isUrl(decodedText);
		let isR2Image = false;
		let r2Key: string | undefined;

		// Check if it's an R2 URL and detect if it's an image
		if (itemIsUrl) {
			const extractedKey = extractR2Key(decodedText);
			if (extractedKey) {
				r2Key = extractedKey;
				try {
					// Use HEAD request to get Content-Type without downloading the file
					const response = await fetch(decodedText, { method: "HEAD" });
					if (response.ok) {
						const contentType = response.headers.get("Content-Type");
						isR2Image = isImageContentType(contentType);
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

	const handleCopyItem = async (content: string, id: string) => {
		try {
			await navigator.clipboard.writeText(content);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch (err) {
			console.error("Failed to copy", err);
		}
	};

	// Generate Logic
	const handleGenerateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputUrl(e.target.value);
		setGeneratedQrValue(e.target.value);
	};

	// Upload Logic (Abstracted)
	const continueUpload = async (file: File, password?: string) => {
		setIsUploading(true);
		try {
			// 2. Get Presigned PUT URL
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (password) {
				headers["x-access-password"] = password;
			}

			const putRes = await fetch("/api/r2/presign", {
				method: "POST",
				headers,
				body: JSON.stringify({
					action: "put",
					key: file.name,
					contentType: file.type,
					size: file.size,
				}),
			});

			if (putRes.status === 401) {
				// Password invalid or missing during request
				localStorage.removeItem("access_password"); // Clear invalid password
				pendingFileRef.current = file; // Re-queue file
				setShowPasswordModal(true); // Ask again
				setIsUploading(false);
				return;
			}

			if (!putRes.ok) throw new Error("Failed to get upload URL");
			const { url: putUrl, key } = await putRes.json();

			// 2. Upload to R2
			const uploadRes = await fetch(putUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!uploadRes.ok) throw new Error("Upload to R2 failed");

			// 3. Generate QR Code Value - Directly construct R2 public URL
			const publicDomain = env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
			if (!publicDomain) throw new Error("R2 public domain not configured");
			const baseUrl = publicDomain.startsWith("http")
				? publicDomain
				: `https://${publicDomain}`;
			const finalQrValue = `${baseUrl}/${key}`;

			setGeneratedQrValue(finalQrValue);
			setInputUrl(finalQrValue);
			pendingFileRef.current = null; // Clear pending file on success
		} catch (err) {
			console.error("Upload failed", err);
			toast.error(t("toastUploadFailed"));
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// 1. Frontend Size Check (50MB)
		if (file.size > MAX_UPLOAD_SIZE) {
			toast.error(t("toastFileSizeLimit"));
			e.target.value = ""; // Reset input
			return;
		}

		// Check Password
		const storedPwd = localStorage.getItem("access_password");
		if (storedPwd) {
			await continueUpload(file, storedPwd);
		} else {
			// No password, open modal
			pendingFileRef.current = file;
			setShowPasswordModal(true);
		}

		// Reset input so same file can be selected again if needed
		e.target.value = "";
	};

	const handlePasswordSubmit = async () => {
		if (!passwordInput) return;

		try {
			// Pre-validate password
			const res = await fetch("/api/r2/presign", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-access-password": passwordInput,
				},
				body: JSON.stringify({ action: "verify", key: "auth-check" }),
			});

			if (res.status === 401) {
				toast.error(t("toastInvalidPassword"));
				return;
			}
			if (!res.ok) throw new Error("Verification failed");

			// Success
			localStorage.setItem("access_password", passwordInput);
			setShowPasswordModal(false);

			// Logic resumption
			if (pendingFileRef.current) {
				continueUpload(pendingFileRef.current, passwordInput);
			} else {
				fileInputRef.current?.click();
			}
		} catch (err) {
			console.error(err);
			toast.error(t("toastValidationError"));
		}
	};

	const handleUploadClick = () => {
		if (isUploading) return;

		const storedPwd = localStorage.getItem("access_password");
		if (storedPwd) {
			fileInputRef.current?.click();
		} else {
			setShowPasswordModal(true);
		}
	};

	// Download Logic
	const downloadQrCode = () => {
		const svg = document.querySelector("#generated-qr-code");
		if (svg) {
			const svgData = new XMLSerializer().serializeToString(svg);
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();
			img.onload = () => {
				canvas.width = img.width;
				canvas.height = img.height;
				ctx?.drawImage(img, 0, 0);
				const pngFile = canvas.toDataURL("image/png");
				const downloadLink = document.createElement("a");
				downloadLink.download = "qrcode.png";
				downloadLink.href = pngFile;
				downloadLink.click();
			};
			img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
		}
	};

	return (
		<>
			<Head>
				<title>{t("title")}</title>
				<meta content={t("metaDescription")} name="description" />
				<link href="/favicon.ico" rel="icon" />
			</Head>

			{/* Mesh Gradient Background */}
			<main className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6 font-sans text-slate-600">
				<div className="fixed inset-0 z-0 opacity-40">
					<div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-300/30 blur-[100px]" />
					<div className="absolute right-[-5%] bottom-[-10%] h-[600px] w-[600px] rounded-full bg-blue-200/30 blur-[100px]" />
				</div>

				<div className="container relative z-10 mx-auto max-w-6xl">
					{/* Header */}
					<header className="mb-10 flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-indigo-500/10 shadow-lg ring-1 ring-black/5">
								<QrCode className="h-6 w-6 text-indigo-600" />
							</div>
							<div>
								<h1 className="font-bold text-2xl text-slate-800 tracking-tight">
									{t("headerTitle")}
									<span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 align-middle font-medium text-indigo-600 text-xs tracking-normal">
										{t("proBadge")}
									</span>
								</h1>
								<p className="font-medium text-slate-400 text-sm">
									v{versionInfo.version}
								</p>
							</div>
						</div>

						<a
							className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-slate-600 text-sm shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900"
							href="https://github.com/scoful/camera-qr-reader"
							rel="noopener noreferrer"
							target="_blank"
						>
							<Github className="h-4 w-4" />
							<span>{t("github")}</span>
						</a>
					</header>

					{/* Tab Switcher - Centered */}
					<div className="mb-8 flex justify-center">
						<div className="flex w-fit rounded-full bg-white/60 p-1.5 ring-1 ring-black/5 backdrop-blur-md">
							<button
								className={`flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300 ${activeTab === "scan"
									? "bg-indigo-600 text-white shadow-indigo-500/25 shadow-md"
									: "text-slate-500 hover:bg-white/50 hover:text-slate-700"
									}`}
								onClick={() => setActiveTab("scan")}
								type="button"
							>
								<Camera className="h-4 w-4" />
								{t("tabScan")}
							</button>
							<button
								className={`flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300 ${activeTab === "generate"
									? "bg-indigo-600 text-white shadow-indigo-500/25 shadow-md"
									: "text-slate-500 hover:bg-white/50 hover:text-slate-700"
									}`}
								onClick={() => setActiveTab("generate")}
								type="button"
							>
								<QrCode className="h-4 w-4" />
								{t("tabGenerate")}
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
						{/* Left Column: Main Action Area */}
						<div className="flex flex-col gap-6 lg:col-span-7">
							{/* Card Container */}
							<div className="relative min-h-[500px] overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-2xl shadow-indigo-100/50 backdrop-blur-xl transition-all">
								{activeTab === "scan" ? (
									<div className="flex h-full flex-col">
										{isScanning ? (
											<div className="h-full w-full overflow-hidden rounded-[2rem]">
												<QrScanner
													key={scannerKey}
													onScannerReady={handleScannerReady}
													onScanSuccess={handleScanSuccess}
												/>
												<div className="absolute inset-x-0 bottom-8 flex justify-center">
													<button
														className="rounded-full bg-white/90 px-6 py-2 font-medium text-slate-700 text-sm shadow-lg backdrop-blur hover:bg-white"
														onClick={() => setIsScanning(false)}
														type="button"
													>
														{t("cancelScan")}
													</button>
												</div>
											</div>
										) : (
											<div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
												<div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500 shadow-inner">
													<Camera className="h-10 w-10" />
												</div>
												<h2 className="mb-3 font-bold text-2xl text-slate-800">
													{t("scanReadyTitle")}
												</h2>
												<p className="mb-8 max-w-sm text-slate-500 leading-relaxed">
													{t("scanReadyDesc")}
												</p>
												<button
													className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
													onClick={restartScanner}
													type="button"
												>
													<Zap className="h-5 w-5 fill-yellow-400 text-yellow-400 transition-colors group-hover:text-yellow-300" />
													<span>{t("activateCamera")}</span>
												</button>
											</div>
										)}
									</div>
								) : (
									<div className="h flex flex-1 flex-col items-center justify-center p-12">
										<div className="w-full max-w-sm">
											<div className="flex flex-col gap-4">
												{/* Input Field */}
												<div>
													<label
														className="mb-2 block font-semibold text-slate-700 text-sm"
														htmlFor="urlInput"
													>
														{t("inputLabel")}
													</label>
													<input
														className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
														id="urlInput"
														onChange={handleGenerateChange}
														placeholder={t("inputPlaceholder")}
														type="text"
														value={inputUrl}
													/>
												</div>
											</div>

											<div className="relative flex items-center py-6">
												<div className="grow border-slate-200 border-t" />
												<span className="shrink-0 px-3 text-slate-400 text-xs uppercase">
													{t("orUpload")}
												</span>
												<div className="grow border-slate-200 border-t" />
											</div>

											{/* File Upload Area */}
											<div>
												{/* biome-ignore lint/a11y/useSemanticElements: Custom file upload trigger */}
												<div
													className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-slate-300 border-dashed bg-slate-50 py-8 transition-all hover:border-indigo-300 hover:bg-slate-100"
													onClick={handleUploadClick}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															handleUploadClick();
														}
													}}
													role="button"
													tabIndex={0}
												>
													<div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
														{isUploading ? (
															<div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
														) : (
															<div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200">
																<Upload className="h-6 w-6 text-indigo-500" />
															</div>
														)}
														<p className="mb-1 font-medium text-slate-700">
															{isUploading
																? t("uploading")
																: t("clickToUpload")}
														</p>
														<p className="max-w-[200px] text-slate-400 text-xs">
															{t("uploadHint")}
														</p>
													</div>
													<input
														className="hidden"
														disabled={isUploading}
														onChange={handleFileUpload}
														ref={fileInputRef}
														type="file"
													/>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Right Column: Scan History OR Generated Result */}
						<div className="flex flex-col gap-6 lg:col-span-5">
							{activeTab === "generate" && (
								<div className="flex flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-indigo-100/50 shadow-xl backdrop-blur-xl">
									<div className="flex items-center justify-between border-slate-100 border-b bg-white/30 px-6 py-4 backdrop-blur-md">
										<h3 className="flex items-center gap-2 font-bold text-lg text-slate-800">
											<QrCode className="h-5 w-5 text-indigo-500" />
											{t("generatedQrTitle")}
										</h3>
									</div>
									<div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
										<div className="mb-8 w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-indigo-100 bg-white p-4 shadow-sm">
											{generatedQrValue ? (
												<QRCodeSVG
													className="h-full w-full"
													id="generated-qr-code"
													includeMargin
													level="H"
													size={300}
													value={generatedQrValue}
												/>
											) : (
												<div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-xl bg-slate-50">
													<QrCode className="h-16 w-16 text-slate-200" />
													<p className="font-medium text-slate-400 text-sm">
														{t("resultPlaceholder")}
													</p>
												</div>
											)}
										</div>
										<button
											className="flex w-full max-w-[280px] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-indigo-500/20 shadow-lg transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none"
											disabled={!generatedQrValue}
											onClick={downloadQrCode}
											type="button"
										>
											{t("downloadPng")}
										</button>
									</div>
								</div>
							)}

							{activeTab === "scan" && (
								<div className="flex flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-indigo-100/50 shadow-xl backdrop-blur-xl">
									<div className="flex items-center justify-between border-slate-100 border-b bg-white/30 px-6 py-4 backdrop-blur-md">
										<h3 className="flex items-center gap-2 font-bold text-lg text-slate-800">
											<History className="h-5 w-5 text-indigo-500" />
											{t("historyTitle")}
										</h3>
										{scanHistory.length > 0 && (
											<button
												className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-500 text-xs hover:bg-rose-50"
												onClick={clearHistory}
												type="button"
											>
												<Trash2 className="h-3.5 w-3.5" />
												{t("clearHistory")}
											</button>
										)}
									</div>
									<div className="custom-scrollbar max-h-[600px] flex-1 overflow-y-auto p-4">
										{scanHistory.length === 0 ? (
											<div className="flex h-full flex-col items-center justify-center py-20 text-center text-slate-400">
												<History className="mb-3 h-12 w-12 text-slate-200" />
												<p className="text-sm">{t("noHistory")}</p>
											</div>
										) : (
											<div className="space-y-3">
												{scanHistory.map((item) => (
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
															{item.isUrl ? (
																<a
																	className="break-all font-medium text-indigo-600 text-sm leading-relaxed hover:underline"
																	href={item.content}
																	rel="noopener noreferrer"
																	target="_blank"
																>
																	{item.content}
																</a>
															) : (
																<p className="break-all font-medium text-slate-800 text-sm leading-relaxed">
																	{item.content}
																</p>
															)}
														</div>
														<div className="flex items-center justify-end gap-2 border-slate-100 border-t pt-2 opacity-0 transition-opacity group-hover:opacity-100">
															<button
																className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-xs transition-colors ${copiedId === item.id
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
															{item.isUrl && (
																<a
																	className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 font-bold text-indigo-600 text-xs transition-colors hover:bg-indigo-100"
																	href={item.content}
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
							)}
						</div>
					</div>
				</div>

				{/* Floating Help Button */}
				<button
					className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
					onClick={() => setShowHelpModal(true)}
					type="button"
				>
					<HelpCircle className="h-6 w-6" />
				</button>

				{/* Help Modal */}
				{showHelpModal && (
					<div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/30 p-4 backdrop-blur-sm duration-200">
						{/* biome-ignore lint/a11y/useSemanticElements: Backdrop overlay */}
						<div
							className="absolute inset-0 z-0"
							onClick={() => setShowHelpModal(false)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									setShowHelpModal(false);
								}
							}}
							role="button"
							tabIndex={0}
						/>
						<div className="zoom-in-95 relative z-10 flex max-h-[85vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
							{/* Modal Header */}
							<div className="flex items-center justify-between border-slate-100 border-b p-6">
								<h2 className="font-bold text-slate-800 text-xl">
									{t("helpTitle")}
								</h2>
								<button
									className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
									onClick={() => setShowHelpModal(false)}
									type="button"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{/* Modal Tabs */}
							<div className="flex border-slate-100 border-b bg-slate-50/50">
								<button
									className={`flex-1 py-4 font-semibold text-sm transition-colors ${helpTab === "guide"
										? "border-indigo-600 border-b-2 text-indigo-600"
										: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
										}`}
									onClick={() => setHelpTab("guide")}
									type="button"
								>
									{t("tabGuide")}
								</button>
								<button
									className={`flex-1 py-4 font-semibold text-sm transition-colors ${helpTab === "ios"
										? "border-indigo-600 border-b-2 text-indigo-600"
										: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
										}`}
									onClick={() => setHelpTab("ios")}
									type="button"
								>
									<span className="flex items-center justify-center gap-2">
										<Zap className="h-4 w-4 fill-indigo-600 text-indigo-600" />{" "}
										{t("tabIos")}
									</span>
								</button>
							</div>

							{/* Modal Content */}
							<div className="custom-scrollbar overflow-y-auto p-8">
								{helpTab === "guide" ? (
									<div className="space-y-6">
										<div className="flex gap-4">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
												<Camera className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-bold text-slate-800">
													{t("guideScanTitle")}
												</h3>
												<p className="mt-1 text-slate-500 text-sm leading-relaxed">
													{t("guideScanDesc")}
												</p>
											</div>
										</div>
										<div className="flex gap-4">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
												<QrCode className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-bold text-slate-800">
													{t("guideGenTitle")}
												</h3>
												<p className="mt-1 text-slate-500 text-sm leading-relaxed">
													{t("guideGenDesc")}
												</p>
											</div>
										</div>
										<div className="flex gap-4">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
												<Wifi className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-bold text-slate-800">
													{t("guideShareTitle")}
												</h3>
												<p className="mt-1 text-slate-500 text-sm leading-relaxed">
													{t("guideShareDesc")}
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className="flex flex-col gap-6">
										<div className="text-center">
											<h3 className="font-bold text-slate-800 text-xl tracking-tight">
												{t("iosTitle")}
											</h3>
											<p className="mt-2 text-slate-500 text-sm">
												{t("iosDesc")}
											</p>
										</div>

										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											{/* Card 1: Scan Helper */}
											<div className="group relative flex flex-col rounded-3xl border border-blue-100 bg-blue-50/30 p-5 transition-all hover:bg-blue-50">
												<div className="mb-4 flex items-start justify-between">
													<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
														<Camera className="h-5 w-5" />
													</div>
													<div className="rounded-full bg-blue-100 px-2 py-1 font-bold text-[10px] text-blue-600">
														{t("shortcut1Title")}
													</div>
												</div>
												<h4 className="mb-1 font-bold text-slate-800">
													{t("shortcut1Sub")}
												</h4>
												<p className="mb-4 text-slate-500 text-xs leading-relaxed">
													{t("shortcut1Desc")}
												</p>
												<div className="mt-auto flex flex-col items-center">
													<div className="mb-3 rounded-xl border-2 border-white bg-white p-2 shadow-sm">
														<QRCodeSVG
															level="M"
															size={120}
															value="https://www.icloud.com/shortcuts/scan-example"
														/>
													</div>
													<a
														className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-bold text-white text-xs shadow-blue-500/20 shadow-lg transition-all hover:bg-blue-700 active:scale-95"
														href="https://www.icloud.com/shortcuts/scan-example"
														rel="noopener noreferrer"
														target="_blank"
													>
														<Zap className="h-3.5 w-3.5 fill-white" />
														{t("getShortcut")}
													</a>
												</div>
											</div>

											{/* Card 2: Generate Helper */}
											<div className="group relative flex flex-col rounded-3xl border border-purple-100 bg-purple-50/30 p-5 transition-all hover:bg-purple-50">
												<div className="mb-4 flex items-start justify-between">
													<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm ring-1 ring-purple-100">
														<QrCode className="h-5 w-5" />
													</div>
													<div className="rounded-full bg-purple-100 px-2 py-1 font-bold text-[10px] text-purple-600">
														{t("shortcut2Title")}
													</div>
												</div>
												<h4 className="mb-1 font-bold text-slate-800">
													{t("shortcut2Sub")}
												</h4>
												<p className="mb-4 text-slate-500 text-xs leading-relaxed">
													{t("shortcut2Desc")}
												</p>
												<div className="mt-auto flex flex-col items-center">
													<div className="mb-3 rounded-xl border-2 border-white bg-white p-2 shadow-sm">
														<QRCodeSVG
															level="M"
															size={120}
															value="https://www.icloud.com/shortcuts/gen-example"
														/>
													</div>
													<a
														className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 font-bold text-white text-xs shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700 active:scale-95"
														href="https://www.icloud.com/shortcuts/gen-example"
														rel="noopener noreferrer"
														target="_blank"
													>
														<Zap className="h-3.5 w-3.5 fill-white" />
														{t("getShortcut")}
													</a>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</main>

			<style global jsx>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #cbd5e1;
					border-radius: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #94a3b8;
				}
			`}</style>
			{/* Password Modal */}
			<PasswordModal
				isOpen={showPasswordModal}
				onChange={setPasswordInput}
				onClose={() => {
					setShowPasswordModal(false);
					pendingFileRef.current = null;
				}}
				onSubmit={handlePasswordSubmit}
				value={passwordInput}
			/>
		</>
	);
}

// Password Modal Component (Inline for simplicity, or could be extracted)
function PasswordModal({
	isOpen,
	onClose,
	onSubmit,
	value,
	onChange,
}: {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
	value: string;
	onChange: (val: string) => void;
}) {
	const t = useTranslations("Index");
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
				<div className="mb-4 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
						<Lock className="h-5 w-5" />
					</div>
					<h3 className="font-bold text-lg text-slate-800">
						{t("authModalTitle")}
					</h3>
				</div>
				<p className="mb-4 text-slate-500 text-sm">{t("authModalDesc")}</p>
				<input
					className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && onSubmit()}
					placeholder={t("authModalPlaceholder")}
					type="password"
					value={value}
				/>
				<div className="flex justify-end gap-3">
					<button
						className="rounded-lg px-4 py-2 font-medium text-slate-500 hover:bg-slate-100"
						onClick={onClose}
						type="button"
					>
						{t("commonCancel")}
					</button>
					<button
						className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-indigo-500/20 shadow-lg hover:bg-indigo-700"
						onClick={onSubmit}
						type="button"
					>
						{t("commonConfirm")}
					</button>
				</div>
			</div>
		</div>
	);
}

export const getStaticProps: GetStaticProps = async (context) => {
	return {
		props: {
			messages: (await import(`../../messages/${context.locale}.json`)).default,
		},
	};
};
