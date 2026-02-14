import { Camera, Github, HelpCircle, QrCode } from "lucide-react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import GenerateTab from "@/components/GenerateTab";
import GeneratedQrPreview from "@/components/GeneratedQrPreview";
import HelpModal from "@/components/HelpModal";
import PasswordModal from "@/components/PasswordModal";
import ScanHistory from "@/components/ScanHistory";
import ScanTab from "@/components/ScanTab";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useScanHistory } from "@/hooks/useScanHistory";
import { useShortCode } from "@/hooks/useShortCode";
import versionInfo from "../../version.json";

export default function Home() {
	const t = useTranslations("Index");
	const [activeTab, setActiveTab] = useState<"scan" | "generate">("scan");
	const [generatedQrValue, setGeneratedQrValue] = useState("");
	const [inputUrl, setInputUrl] = useState("");
	const [showHelpModal, setShowHelpModal] = useState(false);

	const {
		scanHistory,
		isScanning,
		setIsScanning,
		scannerKey,
		handleScanSuccess,
		handleScannerReady,
		restartScanner,
		clearHistory,
	} = useScanHistory();

	const {
		useShortCodeEnabled,
		setUseShortCodeEnabled,
		isShortening,
		generateWithShortCode,
	} = useShortCode();

	const {
		isUploading,
		showPasswordModal,
		setShowPasswordModal,
		passwordInput,
		setPasswordInput,
		pendingFileRef,
		fileInputRef,
		handleFileUpload,
		handlePasswordSubmit,
		handleUploadClick,
		handlePasteUpload,
	} = useFileUpload({
		onQrValueChange: setGeneratedQrValue,
		onInputUrlChange: setInputUrl,
		onPasswordSuccess: () => {
			// After password saved, retry short code generation if that's what triggered the modal
			if (useShortCodeEnabled && inputUrl) {
				generateWithShortCode(
					inputUrl,
					(shortUrl) => setGeneratedQrValue(shortUrl),
					() => setShowPasswordModal(true),
				);
			}
		},
	});

	// Listen for paste events when Generate tab is active
	useEffect(() => {
		if (activeTab !== "generate") return;
		document.addEventListener("paste", handlePasteUpload);
		return () => document.removeEventListener("paste", handlePasteUpload);
	}, [activeTab, handlePasteUpload]);

	const handleGenerateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputUrl(value);
		if (useShortCodeEnabled && value.length > 0) {
			setGeneratedQrValue("");
		} else {
			setGeneratedQrValue(value);
		}
	};

	const handleShortCodeToggle = (enabled: boolean) => {
		setUseShortCodeEnabled(enabled);
		if (!enabled) {
			setGeneratedQrValue(inputUrl);
		} else {
			setGeneratedQrValue("");
		}
	};

	const handleGenerateShortCode = () => {
		generateWithShortCode(
			inputUrl,
			(shortUrl) => setGeneratedQrValue(shortUrl),
			() => setShowPasswordModal(true),
		);
	};

	return (
		<>
			<Head>
				<title>{t("title")}</title>
				<meta content={t("metaDescription")} name="description" />
				<link href="/favicon.ico" rel="icon" />
			</Head>

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

					{/* Tab Switcher */}
					<div className="mb-8 flex justify-center">
						<div className="flex w-fit rounded-full bg-white/60 p-1.5 ring-1 ring-black/5 backdrop-blur-md">
							<button
								className={`flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300 ${
									activeTab === "scan"
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
								className={`flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300 ${
									activeTab === "generate"
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
						{/* Left Column */}
						<div className="flex flex-col gap-6 lg:col-span-7">
							<div className="relative min-h-[500px] overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-2xl shadow-indigo-100/50 backdrop-blur-xl transition-all">
								{activeTab === "scan" ? (
									<div className="flex h-full flex-col">
										<ScanTab
											isScanning={isScanning}
											onCancelScan={() => setIsScanning(false)}
											onRestartScanner={restartScanner}
											onScanSuccess={handleScanSuccess}
											onScannerReady={handleScannerReady}
											scannerKey={scannerKey}
										/>
									</div>
								) : (
									<GenerateTab
										fileInputRef={fileInputRef}
										inputUrl={inputUrl}
										isShortening={isShortening}
										isUploading={isUploading}
										onFileUpload={handleFileUpload}
										onGenerateShortCode={handleGenerateShortCode}
										onInputChange={handleGenerateChange}
										onShortCodeToggle={handleShortCodeToggle}
										onUploadClick={handleUploadClick}
										useShortCode={useShortCodeEnabled}
									/>
								)}
							</div>
						</div>

						{/* Right Column */}
						<div className="flex flex-col gap-6 lg:col-span-5">
							{activeTab === "generate" && (
								<GeneratedQrPreview
									generatedQrValue={generatedQrValue}
									inputUrl={inputUrl}
								/>
							)}
							{activeTab === "scan" && (
								<ScanHistory
									items={scanHistory}
									onClear={clearHistory}
								/>
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

				<HelpModal
					isOpen={showHelpModal}
					onClose={() => setShowHelpModal(false)}
				/>
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

export const getStaticProps: GetStaticProps = async (context) => {
	return {
		props: {
			messages: (await import(`../../messages/${context.locale}.json`)).default,
		},
	};
};
