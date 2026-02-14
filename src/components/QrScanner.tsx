import {
	type Html5QrcodeResult,
	Html5QrcodeScanner,
	Html5QrcodeScanType,
} from "html5-qrcode";
import { useEffect, useRef } from "react";

interface QrScannerProps {
	onScanSuccess?: (
		decodedText: string,
		decodedResult: Html5QrcodeResult,
	) => void;
	onScannerReady?: (stopScanner: () => Promise<void>) => void;
}

export default function QrScanner({
	onScanSuccess,
	onScannerReady,
}: QrScannerProps) {
	const scannerRef = useRef<Html5QrcodeScanner | null>(null);
	const hasRendered = useRef(false);

	// 保持最新的回调引用，避免因父组件重渲染导致重新初始化
	const onScanSuccessRef = useRef(onScanSuccess);
	useEffect(() => {
		onScanSuccessRef.current = onScanSuccess;
	}, [onScanSuccess]);

	useEffect(() => {
		// 使用hasRendered标记防止严格模式下的双重渲染
		if (hasRendered.current) {
			return;
		}
		hasRendered.current = true;

		const scanner = new Html5QrcodeScanner(
			"qr-reader",
			{
				fps: 30,
				// 动态设置扫描框为整个预览窗口的100%,最大化识别区域
				qrbox: (viewfinderWidth, viewfinderHeight) => {
					const edgePercentage = 1.0; // 使用100%的窗口大小
					const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
					const qrboxSize = Math.floor(minEdgeSize * edgePercentage);
					return {
						width: qrboxSize,
						height: qrboxSize,
					};
				},
				formatsToSupport: [0], // 仅支持QR码
				supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], // 仅摄像头
				rememberLastUsedCamera: true,
				useBarCodeDetectorIfSupported: false, // 避免部分环境下原生BarcodeDetector兼容性问题
			},
			false, // verbose
		);

		scannerRef.current = scanner;

		// 暴露停止方法给父组件
		const stopScanner = async () => {
			if (scannerRef.current) {
				await scannerRef.current.clear();
				scannerRef.current = null;

				// 清理DOM残留
				const readerElement = document.getElementById("qr-reader");
				if (readerElement) {
					readerElement.innerHTML = "";
				}
			}
		};

		onScannerReady?.(stopScanner);

		scanner.render(
			(decodedText, decodedResult) => {
				onScanSuccessRef.current?.(decodedText, decodedResult);
				// 扫码成功后自动停止
				stopScanner().catch(console.error);
			},
			() => {
				// 静默处理扫描错误
			},
		);

		// 清理函数
		return () => {
			hasRendered.current = false; // 重置标记，允许下次重新渲染
			const currentScanner = scannerRef.current;
			if (currentScanner) {
				scannerRef.current = null;
				currentScanner.clear().catch((err) => {
					console.error("清理扫描器失败:", err);
				});
			}
		};
	}, [onScannerReady]);

	return (
		<div className="flex h-full w-full max-w-4xl items-center justify-center">
			<style>{`
				/* 隐藏库自带的 Stop Scanning 按钮，使用自定义按钮 */
				#html5-qrcode-button-camera-stop {
					display: none !important;
				}

				/* 容器样式 */
				#qr-reader {
					border: none !important;
					background: transparent !important;
					border-radius: 16px !important;
					padding: 0 !important;
				}

				/* 所有文本改为深色 */
				#qr-reader * {
					color: #1f2937 !important;
				}

				/* 按钮样式 - 现代渐变蓝色 */
				#qr-reader button {
					background: linear-gradient(to right, #3b82f6, #2563eb) !important;
					color: white !important;
					border: none !important;
					padding: 10px 20px !important;
					border-radius: 10px !important;
					font-weight: 600 !important;
					cursor: pointer !important;
					margin: 6px 3px !important;
					transition: all 0.2s !important;
					font-size: 14px !important;
				}

				#qr-reader button:hover {
					box-shadow: 0 8px 16px -4px rgb(59 130 246 / 0.4) !important;
					transform: scale(1.05) !important;
				}

				/* 下拉框样式 - 现代白色 */
				#qr-reader select {
					background-color: #f9fafb !important;
					color: #1f2937 !important;
					border: 1px solid #d1d5db !important;
					padding: 10px 16px !important;
					border-radius: 10px !important;
					margin: 8px 0 !important;
					min-width: 200px !important;
					font-weight: 500 !important;
				}

				#qr-reader select:focus {
					border-color: #3b82f6 !important;
					outline: none !important;
					box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
				}

				/* 扫描区域 */
				#qr-reader__scan_region {
					border: 2px solid #3b82f6 !important;
					background: rgba(59, 130, 246, 0.05) !important;
					border-radius: 12px !important;
				}

				/* 视频元素 */
				#qr-reader video {
					min-width: 400px !important;
					min-height: 300px !important;
					border-radius: 16px !important;
					transform: scaleX(-1) !important; /* 水平翻转,消除镜像效果 */
					box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.15) !important;
					border: 2px solid #e5e7eb !important;
				}

				/* 标签和提示文本 */
				#qr-reader__dashboard_section,
				#qr-reader__dashboard_section_csr,
				#qr-reader__dashboard_section_swaplink {
					color: #4b5563 !important;
					background: transparent !important;
				}
			`}</style>
			<div id="qr-reader" />
		</div>
	);
}
