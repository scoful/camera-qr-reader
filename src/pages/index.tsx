import Head from "next/head";
import { useState } from "react";
import type { Html5QrcodeResult } from "html5-qrcode";
import QrScanner from "@/components/QrScanner";

interface ScanHistoryItem {
	id: string;
	content: string;
	timestamp: Date;
	isUrl: boolean;
}

export default function Home() {
	const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [scannerKey, setScannerKey] = useState(0);

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

	return (
		<>
			<Head>
				<title>QR Code Scanner</title>
				<meta content="Scan QR codes with your camera" name="description" />
				<link href="/favicon.ico" rel="icon" />
			</Head>
			<main className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
				<div className="container mx-auto flex gap-8 px-4 py-12">
					{/* 左侧：扫描区域 */}
					<div className="flex flex-1 flex-col gap-8">
						<h1 className="text-center font-bold text-4xl text-gray-900 tracking-tight">
							QR Code <span className="text-blue-600">Scanner</span>
						</h1>

						<div className="flex flex-col items-center justify-center gap-4">
							{isScanning ? (
								<QrScanner
									key={scannerKey}
									onScanSuccess={handleScanSuccess}
									onScannerReady={handleScannerReady}
								/>
							) : (
								<div className="flex flex-col items-center gap-4">
									<div className="rounded-2xl bg-white p-16 text-center shadow-lg border border-gray-200">
										<p className="mb-6 text-lg text-gray-600 font-medium">准备扫描二维码</p>
										<button
											className="rounded-xl bg-blue-600 px-10 py-4 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
											onClick={restartScanner}
											type="button"
										>
											📷 开始扫描
										</button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* 右侧：扫描历史 */}
					<div className="w-96 flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h2 className="font-bold text-2xl text-gray-900">扫描历史</h2>
							{scanHistory.length > 0 && (
								<button
									className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 font-medium transition hover:bg-red-100 border border-red-200"
									onClick={clearHistory}
									type="button"
								>
									清空
								</button>
							)}
						</div>

						<div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 12rem)" }}>
							{scanHistory.length === 0 ? (
								<div className="rounded-xl bg-white p-12 text-center text-gray-400 shadow-sm border border-gray-200">
									暂无扫描记录
								</div>
							) : (
								scanHistory.map((item) => (
									<div
										className="rounded-xl bg-white p-5 transition-all hover:shadow-md border border-gray-200 hover:border-blue-300"
										key={item.id}
									>
										<div className="mb-3 flex items-start justify-between gap-2">
											<div className="flex-1 break-all text-sm text-gray-800 font-medium">
												{item.content}
											</div>
											{item.isUrl && (
												<a
													className="shrink-0 text-xl hover:scale-110 transition-transform"
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
			</main>
		</>
	);
}
