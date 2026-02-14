import type { Html5QrcodeResult } from "html5-qrcode";
import { Camera, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import QrScanner from "@/components/QrScanner";

interface ScanTabProps {
	isScanning: boolean;
	scannerKey: number;
	onScanSuccess: (text: string, result: Html5QrcodeResult) => void;
	onScannerReady: () => void;
	onCancelScan: () => void;
	onRestartScanner: () => void;
}

export default function ScanTab({
	isScanning,
	scannerKey,
	onScanSuccess,
	onScannerReady,
	onCancelScan,
	onRestartScanner,
}: ScanTabProps) {
	const t = useTranslations("Index");

	if (isScanning) {
		return (
			<div className="h-full w-full overflow-hidden rounded-[2rem]">
				<QrScanner
					key={scannerKey}
					onScannerReady={onScannerReady}
					onScanSuccess={onScanSuccess}
				/>
				<div className="absolute inset-x-0 bottom-8 flex justify-center">
					<button
						className="rounded-full bg-white/90 px-6 py-2 font-medium text-slate-700 text-sm shadow-lg backdrop-blur hover:bg-white"
						onClick={onCancelScan}
						type="button"
					>
						{t("cancelScan")}
					</button>
				</div>
			</div>
		);
	}

	return (
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
				onClick={onRestartScanner}
				type="button"
			>
				<Zap className="h-5 w-5 fill-yellow-400 text-yellow-400 transition-colors group-hover:text-yellow-300" />
				<span>{t("activateCamera")}</span>
			</button>
		</div>
	);
}
