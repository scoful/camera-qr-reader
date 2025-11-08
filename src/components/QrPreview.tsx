import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QrPreviewProps {
	value: string;
}

export default function QrPreview({ value }: QrPreviewProps) {
	const qrRef = useRef<HTMLDivElement>(null);

	const handleDownload = () => {
		if (!qrRef.current) return;

		const svg = qrRef.current.querySelector("svg");
		if (!svg) return;

		// 将SVG转换为PNG并下载
		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		canvas.width = 512;
		canvas.height = 512;

		img.onload = () => {
			ctx?.drawImage(img, 0, 0);
			canvas.toBlob((blob) => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					const link = document.createElement("a");
					link.href = url;
					link.download = `qrcode-${Date.now()}.png`;
					link.click();
					URL.revokeObjectURL(url);
				}
			});
		};

		img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			alert("✅ 已复制到剪贴板");
		} catch (err) {
			console.error("复制失败:", err);
		}
	};

	return (
		<div className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/50 overflow-hidden flex flex-col">
			{/* 标题 */}
			<div className="px-6 py-4 border-b border-gray-200/50 bg-gray-50/50 shrink-0">
				<h2 className="font-bold text-xl text-gray-900">🎨 二维码预览</h2>
			</div>

			{/* 内容 - flex-1 自动填充 */}
			<div className="p-6 flex flex-col gap-6 flex-1 justify-center">
				{/* 二维码大图 */}
				<div className="flex flex-col items-center gap-4">
					<div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm" ref={qrRef}>
						<QRCodeSVG
							value={value}
							size={280}
							level="H"
							includeMargin={true}
							bgColor="#ffffff"
							fgColor="#000000"
						/>
					</div>

					{/* 按钮组 */}
					<div className="w-full flex flex-col gap-2.5">
						<button
							className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95"
							onClick={handleDownload}
							type="button"
						>
							⬇️ 下载二维码
						</button>
						<button
							className="w-full rounded-lg bg-blue-50 px-6 py-3 font-semibold text-blue-700 transition-all hover:bg-blue-100 active:scale-95 border border-blue-200"
							onClick={handleCopy}
							type="button"
						>
							📋 复制内容
						</button>
					</div>
				</div>

				{/* 显示内容 */}
				<div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
					<p className="text-xs text-blue-600 font-medium mb-2">二维码内容:</p>
					<p className="text-sm text-gray-800 break-all leading-relaxed">{value}</p>
				</div>
			</div>
		</div>
	);
}

