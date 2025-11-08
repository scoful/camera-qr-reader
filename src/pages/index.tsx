import Head from "next/head";
import { useState } from "react";
import type { Html5QrcodeResult } from "html5-qrcode";
import QrScanner from "@/components/QrScanner";
import QrGenerator from "@/components/QrGenerator";
import QrPreview from "@/components/QrPreview";
import versionInfo from "../../version.json";

interface ScanHistoryItem {
	id: string;
	content: string;
	timestamp: Date;
	isUrl: boolean;
}

export default function Home() {
	const [activeTab, setActiveTab] = useState<"scan" | "generate">("scan");
	const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [scannerKey, setScannerKey] = useState(0);
	const [generatedQrValue, setGeneratedQrValue] = useState("");

	const handleScanSuccess = (decodedText: string, _decodedResult: Html5QrcodeResult) => {
		const newItem: ScanHistoryItem = {
			id: Date.now().toString(),
			content: decodedText,
			timestamp: new Date(),
			isUrl: isUrl(decodedText),
		};

		// 添加到历史记录（最新的在前）
		setScanHistory((prev) => [newItem, ...prev]);

		// 扫描成功后标记为未扫描状态
		setIsScanning(false);
	};

	const handleScannerReady = () => {
		setIsScanning(true);
	};

	const restartScanner = () => {
		// 通过改变key强制重新挂载组件
		setScannerKey((prev) => prev + 1);
		setIsScanning(true);
	};

	// 检测是否为URL
	const isUrl = (text: string): boolean => {
		try {
			const url = new URL(text);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	};

	// 清空历史记录
	const clearHistory = () => {
		setScanHistory([]);
	};

	const handleGenerate = (value: string) => {
		setGeneratedQrValue(value);
	};

	return (
		<>
			<Head>
				<title>QR Code Scanner</title>
				<meta content="Scan QR codes with your camera" name="description" />
				<link href="/favicon.ico" rel="icon" />
			</Head>
			<main className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
				<div className="container mx-auto px-6 py-8 max-w-7xl">
					{/* 标题卡片 */}
					<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-200/50 mb-6">
						<h1 className="text-center font-bold text-3xl text-gray-900 tracking-tight">
							QR Code <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Tools</span>
						</h1>
					</div>

					{/* 主内容区域 - 左右等高 */}
					<div className="flex gap-6">
						{/* 左侧：功能区域 */}
						<div className="flex-1 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50 overflow-hidden flex flex-col">
							{/* Tab 切换 */}
							<div className="flex border-b border-gray-200/50 bg-gray-50/50 shrink-0">
								<button
									className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
										activeTab === "scan"
											? "text-blue-600 bg-white"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
									}`}
									onClick={() => setActiveTab("scan")}
									type="button"
								>
									{activeTab === "scan" && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
									)}
									📷 扫描二维码
								</button>
								<button
									className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
										activeTab === "generate"
											? "text-blue-600 bg-white"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
									}`}
									onClick={() => setActiveTab("generate")}
									type="button"
								>
									{activeTab === "generate" && (
										<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
									)}
									🎨 生成二维码
								</button>
							</div>

							{/* 内容区域 - flex-1 自动填充 */}
							<div className="p-8 flex items-center justify-center flex-1">
								{activeTab === "scan" ? (
									// 扫描模式
									isScanning ? (
										<QrScanner
											key={scannerKey}
											onScanSuccess={handleScanSuccess}
											onScannerReady={handleScannerReady}
										/>
									) : (
										<div className="flex flex-col items-center gap-6 text-center">
											<div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
												<span className="text-5xl">📷</span>
											</div>
											<div>
												<h3 className="text-xl font-semibold text-gray-900 mb-2">准备扫描二维码</h3>
												<p className="text-gray-500 text-sm">点击下方按钮开始使用摄像头扫描</p>
											</div>
											<button
												className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95"
												onClick={restartScanner}
												type="button"
											>
												开始扫描
											</button>
										</div>
									)
								) : (
									// 生成模式
									<QrGenerator onGenerate={handleGenerate} />
								)}
							</div>
						</div>

						{/* 右侧：动态内容 - flex-1 自动等高 */}
						<div className="w-[420px] flex flex-col">
						{activeTab === "scan" ? (
							// 扫描历史
							<div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/50 flex flex-col overflow-hidden">
								{/* 标题栏 */}
								<div className="px-6 py-4 border-b border-gray-200/50 bg-gray-50/50 shrink-0">
									<div className="flex items-center justify-between">
										<h2 className="font-bold text-xl text-gray-900">📋 扫描历史</h2>
										{scanHistory.length > 0 && (
											<button
												className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600 font-medium transition hover:bg-red-100 border border-red-200"
												onClick={clearHistory}
												type="button"
											>
												清空
											</button>
										)}
									</div>
								</div>

								{/* 内容区域 - flex-1 自动填充 */}
								<div className="p-6 flex-1 overflow-y-auto">
									<div className="flex flex-col gap-2.5">
										{scanHistory.length === 0 ? (
											<div className="rounded-xl bg-gray-50/50 p-8 text-center text-gray-400 border border-gray-200/50">
												<p className="text-sm">暂无扫描记录</p>
											</div>
										) : (
											scanHistory.map((item) => (
												<div
													className="rounded-lg bg-white p-4 transition-all hover:shadow-md border border-gray-200/50 hover:border-blue-300"
													key={item.id}
												>
													<div className="mb-2 flex items-start justify-between gap-2">
														<div className="flex-1 break-all text-sm text-gray-800 font-medium leading-relaxed">
															{item.content}
														</div>
														{item.isUrl && (
															<a
																className="shrink-0 text-lg hover:scale-110 transition-transform"
																href={item.content}
																rel="noopener noreferrer"
																target="_blank"
																title="打开链接"
															>
																🔗
															</a>
														)}
													</div>
													<div className="flex items-center justify-between gap-2">
														<span className="text-xs text-gray-500">
															{item.timestamp.toLocaleTimeString()}
														</span>
														<button
															className="text-xs text-blue-600 font-medium transition hover:text-blue-700 hover:underline"
															onClick={() => {
																navigator.clipboard.writeText(item.content);
																alert("已复制");
															}}
															type="button"
														>
															📋 复制
														</button>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						) : (
							// 二维码预览
							generatedQrValue ? (
								<QrPreview value={generatedQrValue} />
							) : (
								<div className="rounded-2xl bg-white/80 backdrop-blur-sm p-12 shadow-sm border border-gray-200/50 flex items-center justify-center flex-1">
									<div className="text-center text-gray-400">
										<div className="text-4xl mb-3">👈</div>
										<p className="text-sm">输入文本后点击生成</p>
									</div>
								</div>
							)
						)}
					</div>
				</div>

				{/* 版本号 */}
				<footer className="mt-6 text-center">
					<p className="text-xs text-gray-400">
						v{versionInfo.version}
					</p>
				</footer>
			</div>
		</main>
		</>
	);
}
