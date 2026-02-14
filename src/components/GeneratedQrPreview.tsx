import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

interface GeneratedQrPreviewProps {
	generatedQrValue: string;
	inputUrl: string;
}

export default function GeneratedQrPreview({
	generatedQrValue,
	inputUrl,
}: GeneratedQrPreviewProps) {
	const t = useTranslations("Index");

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
				{generatedQrValue && generatedQrValue !== inputUrl && (
					<p className="mb-4 max-w-[280px] break-all rounded-lg bg-slate-50 px-3 py-2 text-center font-mono text-slate-500 text-xs">
						{generatedQrValue}
					</p>
				)}
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
	);
}
