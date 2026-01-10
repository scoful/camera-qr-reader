import Head from "next/head";
import { useState, useEffect } from "react";
import type { Html5QrcodeResult } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "@/components/QrScanner";
import versionInfo from "../../version.json";
import { useTranslations } from "next-intl";
import type { GetStaticProps } from "next";
import {
	Camera,
	QrCode,
	History,
	Copy,
	Check,
	Link as LinkIcon,
	Trash2,
	Github,
	Smartphone,
	Wifi,
	Zap,
	HelpCircle,
	X,
	ChevronRight,
	ExternalLink,
} from "lucide-react";

interface ScanHistoryItem {
	id: string;
	content: string;
	timestamp: Date;
	isUrl: boolean;
}

export default function Home() {
	const t = useTranslations("Index");
	const [activeTab, setActiveTab] = useState<"scan" | "generate">("scan");
	const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [scannerKey, setScannerKey] = useState(0);
	const [generatedQrValue, setGeneratedQrValue] = useState("");
	const [inputUrl, setInputUrl] = useState("");
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [showHelpModal, setShowHelpModal] = useState(false);
	const [helpTab, setHelpTab] = useState<"guide" | "ios">("guide");

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

	const handleScanSuccess = (
		decodedText: string,
		_decodedResult: Html5QrcodeResult,
	) => {
		const newItem: ScanHistoryItem = {
			id: Date.now().toString(),
			content: decodedText,
			timestamp: new Date(),
			isUrl: isUrl(decodedText),
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
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-indigo-500/10 ring-1 ring-black/5">
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
							target="_blank"
							rel="noopener noreferrer"
						>
							<Github className="h-4 w-4" />
							<span>{t("github")}</span>
						</a>
					</header>

					{/* Tab Switcher - Centered */}
					<div className="mb-8 flex justify-center">
						<div className="flex w-fit rounded-full bg-white/60 p-1.5 backdrop-blur-md ring-1 ring-black/5">
							<button
								onClick={() => setActiveTab("scan")}
								className={`flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300 ${activeTab === "scan"
									? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
									: "text-slate-500 hover:bg-white/50 hover:text-slate-700"
									}`}
							>
								<Camera className="h-4 w-4" />
								{t("tabScan")}
							</button>
							<button
								onClick={() => setActiveTab("generate")}
								className={`flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300 ${activeTab === "generate"
									? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
									: "text-slate-500 hover:bg-white/50 hover:text-slate-700"
									}`}
							>
								<QrCode className="h-4 w-4" />
								{t("tabGenerate")}
							</button>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
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
														onClick={() => setIsScanning(false)}
														className="rounded-full bg-white/90 px-6 py-2 font-medium text-slate-700 text-sm shadow-lg backdrop-blur hover:bg-white"
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
													onClick={restartScanner}
													className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
												>
													<Zap className="h-5 w-5 fill-yellow-400 text-yellow-400 transition-colors group-hover:text-yellow-300" />
													<span>{t("activateCamera")}</span>
												</button>
											</div>
										)}
									</div>
								) : (
									<div className="flex h flex-1 flex-col items-center justify-center p-12">
										<div className="w-full max-w-sm">
											<div className="mb-8 overflow-hidden rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
												{generatedQrValue ? (
													<QRCodeSVG
														id="generated-qr-code"
														value={generatedQrValue}
														size={300}
														level="H"
														className="h-full w-full"
														includeMargin
													/>
												) : (
													<div className="aspect-square flex items-center justify-center rounded-lg bg-slate-50 text-slate-300">
														<QrCode className="h-16 w-16 opacity-50" />
													</div>
												)}
											</div>

											<div className="flex flex-col gap-4">
												<input
													type="text"
													placeholder={t("inputPlaceholder")}
													className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
													value={inputUrl}
													onChange={handleGenerateChange}
												/>
												<button
													disabled={!generatedQrValue}
													onClick={downloadQrCode}
													className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
												>
													{t("downloadPng")}
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Right Column: Scan History Only */}
						<div className="flex flex-col gap-6 lg:col-span-5">
							{activeTab === "scan" && (
								<div className="flex flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-xl shadow-indigo-100/50 backdrop-blur-xl">
									<div className="flex items-center justify-between border-slate-100 border-b bg-white/30 px-6 py-4 backdrop-blur-md">
										<h3 className="flex items-center gap-2 font-bold text-lg text-slate-800">
											<History className="h-5 w-5 text-indigo-500" />
											{t("historyTitle")}
										</h3>
										{scanHistory.length > 0 && (
											<button
												onClick={clearHistory}
												className="flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-rose-500 text-xs hover:bg-rose-50"
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
														key={item.id}
														className="group relative flex flex-col gap-3 rounded-xl border border-white bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md"
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
																	href={item.content}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="break-all font-medium text-indigo-600 text-sm leading-relaxed hover:underline"
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
																onClick={() =>
																	handleCopyItem(item.content, item.id)
																}
																className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-xs transition-colors ${copiedId === item.id
																	? "bg-teal-50 text-teal-600"
																	: "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
																	}`}
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
																	href={item.content}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 font-bold text-indigo-600 text-xs transition-colors hover:bg-indigo-100"
																>
																	<LinkIcon className="h-3 w-3" />
																	{t("open")}
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
					onClick={() => setShowHelpModal(true)}
					className="fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
				>
					<HelpCircle className="h-6 w-6" />
				</button>

				{/* Help Modal */}
				{showHelpModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
						<div
							onClick={() => setShowHelpModal(false)}
							className="absolute inset-0 z-0"
						/>
						<div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
							{/* Modal Header */}
							<div className="flex items-center justify-between border-slate-100 border-b p-6">
								<h2 className="font-bold text-xl text-slate-800">
									{t("helpTitle")}
								</h2>
								<button
									onClick={() => setShowHelpModal(false)}
									className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{/* Modal Tabs */}
							<div className="flex border-slate-100 border-b bg-slate-50/50">
								<button
									onClick={() => setHelpTab("guide")}
									className={`flex-1 py-4 font-semibold text-sm transition-colors ${helpTab === "guide"
										? "border-b-2 border-indigo-600 text-indigo-600"
										: "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
										}`}
								>
									{t("tabGuide")}
								</button>
								<button
									onClick={() => setHelpTab("ios")}
									className={`flex-1 py-4 font-semibold text-sm transition-colors ${helpTab === "ios"
										? "border-b-2 border-indigo-600 text-indigo-600"
										: "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
										}`}
								>
									<span className="flex items-center justify-center gap-2">
										<Zap className="h-4 w-4 fill-indigo-600 text-indigo-600" /> {t("tabIos")}
									</span>
								</button>
							</div>

							{/* Modal Content */}
							<div className="p-8 overflow-y-auto custom-scrollbar">
								{helpTab === "guide" ? (
									<div className="space-y-6">
										<div className="flex gap-4">
											<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
												<Camera className="h-6 w-6" />
											</div>
											<div>
												<h3 className="font-bold text-slate-800">{t("guideScanTitle")}</h3>
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
												<h3 className="font-bold text-slate-800">{t("guideGenTitle")}</h3>
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
												<h3 className="font-bold text-slate-800">{t("guideShareTitle")}</h3>
												<p className="mt-1 text-slate-500 text-sm leading-relaxed">
													{t("guideShareDesc")}
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className="flex flex-col gap-6">
										<div className="text-center">
											<h3 className="font-bold text-xl text-slate-800 tracking-tight">
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
												<p className="mb-4 text-xs text-slate-500 leading-relaxed">
													{t("shortcut1Desc")}
												</p>
												<div className="mt-auto flex flex-col items-center">
													<div className="mb-3 rounded-xl border-2 border-white bg-white p-2 shadow-sm">
														<QRCodeSVG
															value="https://www.icloud.com/shortcuts/scan-example"
															size={120}
															level="M"
														/>
													</div>
													<a
														href="https://www.icloud.com/shortcuts/scan-example"
														target="_blank"
														rel="noopener noreferrer"
														className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-bold text-white text-xs shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
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
												<p className="mb-4 text-xs text-slate-500 leading-relaxed">
													{t("shortcut2Desc")}
												</p>
												<div className="mt-auto flex flex-col items-center">
													<div className="mb-3 rounded-xl border-2 border-white bg-white p-2 shadow-sm">
														<QRCodeSVG
															value="https://www.icloud.com/shortcuts/gen-example"
															size={120}
															level="M"
														/>
													</div>
													<a
														href="https://www.icloud.com/shortcuts/gen-example"
														target="_blank"
														rel="noopener noreferrer"
														className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 font-bold text-white text-xs shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700 active:scale-95"
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

			<style jsx global>{`
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
		</>
	);
}

export const getStaticProps: GetStaticProps = async (context) => {
	return {
		props: {
			messages: (await import(`../../messages/${context.locale}.json`)).default,
		},
	};
};
