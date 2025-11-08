import type { Html5QrcodeResult } from "html5-qrcode";
import Head from "next/head";
import { useState } from "react";
import QrGenerator from "@/components/QrGenerator";
import QrPreview from "@/components/QrPreview";
import QrScanner from "@/components/QrScanner";
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
				<div className="container mx-auto max-w-7xl px-6 py-8">
					{/* 标题卡片 */}
					<div className="relative mb-6 rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
						<h1 className="text-center font-bold text-3xl text-gray-900 tracking-tight">
							QR Code{" "}
							<span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
								Tools
							</span>
						</h1>
						{/* 版本号 - 右上角 */}
						<div className="absolute top-6 right-6">
							<span className="font-medium text-gray-400 text-xs">
								v{versionInfo.version}
							</span>
						</div>
					</div>

					{/* 主内容区域 - 左右等高 */}
					<div className="flex gap-6">
						{/* 左侧：功能区域 */}
						<div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 shadow-lg backdrop-blur-sm">
							{/* Tab 切换 */}
							<div className="flex shrink-0 border-gray-200/50 border-b bg-gray-50/50">
								<button
									className={`relative flex-1 px-6 py-4 font-semibold transition-all ${
										activeTab === "scan"
											? "bg-white text-blue-600"
											: "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
									}`}
									onClick={() => setActiveTab("scan")}
									type="button"
								>
									{activeTab === "scan" && (
										<div className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600"></div>
									)}
									📷 扫描二维码
								</button>
								<button
									className={`relative flex-1 px-6 py-4 font-semibold transition-all ${
										activeTab === "generate"
											? "bg-white text-blue-600"
											: "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
									}`}
									onClick={() => setActiveTab("generate")}
									type="button"
								>
									{activeTab === "generate" && (
										<div className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600"></div>
									)}
									🎨 生成二维码
								</button>
							</div>

							{/* 内容区域 - flex-1 自动填充 */}
							<div className="flex flex-1 items-center justify-center p-8">
								{activeTab === "scan" ? (
									// 扫描模式
									isScanning ? (
										<QrScanner
											key={scannerKey}
											onScannerReady={handleScannerReady}
											onScanSuccess={handleScanSuccess}
										/>
									) : (
										<div className="flex flex-col items-center gap-6 text-center">
											<div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
												<span className="text-5xl">📷</span>
											</div>
											<div>
												<h3 className="mb-2 font-semibold text-gray-900 text-xl">
													准备扫描二维码
												</h3>
												<p className="text-gray-500 text-sm">
													点击下方按钮开始使用摄像头扫描
												</p>
											</div>
											<button
												className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95"
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
						<div className="flex w-[420px] flex-col">
							{activeTab === "scan" ? (
								// 扫描历史
								<div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 shadow-sm backdrop-blur-sm">
									{/* 标题栏 */}
									<div className="shrink-0 border-gray-200/50 border-b bg-gray-50/50 px-6 py-4">
										<div className="flex items-center justify-between">
											<h2 className="font-bold text-gray-900 text-xl">
												📋 扫描历史
											</h2>
											{scanHistory.length > 0 && (
												<button
													className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-600 text-xs transition hover:bg-red-100"
													onClick={clearHistory}
													type="button"
												>
													清空
												</button>
											)}
										</div>
									</div>

									{/* 内容区域 - flex-1 自动填充 */}
									<div className="flex-1 overflow-y-auto p-6">
										<div className="flex flex-col gap-2.5">
											{scanHistory.length === 0 ? (
												<div className="rounded-xl border border-gray-200/50 bg-gray-50/50 p-8 text-center text-gray-400">
													<p className="text-sm">暂无扫描记录</p>
												</div>
											) : (
												scanHistory.map((item) => (
													<div
														className="rounded-lg border border-gray-200/50 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
														key={item.id}
													>
														<div className="mb-2 flex items-start justify-between gap-2">
															<div className="flex-1 break-all font-medium text-gray-800 text-sm leading-relaxed">
																{item.content}
															</div>
															{item.isUrl && (
																<a
																	className="shrink-0 text-lg transition-transform hover:scale-110"
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
															<span className="text-gray-500 text-xs">
																{item.timestamp.toLocaleTimeString()}
															</span>
															<button
																className="font-medium text-blue-600 text-xs transition hover:text-blue-700 hover:underline"
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
							) : // 二维码预览
							generatedQrValue ? (
								<QrPreview value={generatedQrValue} />
							) : (
								<div className="flex flex-1 items-center justify-center rounded-2xl border border-gray-200/50 bg-white/80 p-12 shadow-sm backdrop-blur-sm">
									<div className="text-center text-gray-400">
										<div className="mb-3 text-4xl">👈</div>
										<p className="text-sm">输入文本后点击生成</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
