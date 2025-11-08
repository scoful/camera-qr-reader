import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

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
		<div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 shadow-sm backdrop-blur-sm">
			{/* 标题 */}
			<div className="shrink-0 border-gray-200/50 border-b bg-gray-50/50 px-6 py-4">
				<h2 className="font-bold text-gray-900 text-xl">🎨 二维码预览</h2>
			</div>

			{/* 内容 - flex-1 自动填充 */}
			<div className="flex flex-1 flex-col justify-center gap-6 p-6">
				{/* 二维码大图 */}
				<div className="flex flex-col items-center gap-4">
					<div
						className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm"
						ref={qrRef}
					>
						<QRCodeSVG
							bgColor="#ffffff"
							fgColor="#000000"
							includeMargin={true}
							level="H"
							size={280}
							value={value}
						/>
					</div>

					{/* 按钮组 */}
					<div className="flex w-full flex-col gap-2.5">
						<button
							className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95"
							onClick={handleDownload}
							type="button"
						>
							⬇️ 下载二维码
						</button>
						<button
							className="w-full rounded-lg border border-blue-200 bg-blue-50 px-6 py-3 font-semibold text-blue-700 transition-all hover:bg-blue-100 active:scale-95"
							onClick={handleCopy}
							type="button"
						>
							📋 复制内容
						</button>
					</div>
				</div>

				{/* 显示内容 */}
				<div className="rounded-lg border border-blue-200/50 bg-blue-50/50 p-4">
					<p className="mb-2 font-medium text-blue-600 text-xs">二维码内容:</p>
					<p className="break-all text-gray-800 text-sm leading-relaxed">
						{value}
					</p>
				</div>
			</div>
		</div>
	);
}
