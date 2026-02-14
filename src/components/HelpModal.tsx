import { Camera, QrCode, Upload, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface HelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
	const t = useTranslations("Index");
	const [helpTab, setHelpTab] = useState<"guide" | "ios">("guide");

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/30 p-4 backdrop-blur-sm duration-200">
			{/* biome-ignore lint/a11y/useSemanticElements: Backdrop overlay */}
			<div
				className="absolute inset-0 z-0"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						onClose();
					}
				}}
				role="button"
				tabIndex={0}
			/>
			<div className="zoom-in-95 relative z-10 flex max-h-[85vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-slate-100 border-b p-6">
					<h2 className="font-bold text-slate-800 text-xl">
						{t("helpTitle")}
					</h2>
					<button
						className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
						onClick={onClose}
						type="button"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Modal Tabs */}
				<div className="flex border-slate-100 border-b bg-slate-50/50">
					<button
						className={`flex-1 py-4 font-semibold text-sm transition-colors ${
							helpTab === "guide"
								? "border-indigo-600 border-b-2 text-indigo-600"
								: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
						}`}
						onClick={() => setHelpTab("guide")}
						type="button"
					>
						{t("tabGuide")}
					</button>
					<button
						className={`flex-1 py-4 font-semibold text-sm transition-colors ${
							helpTab === "ios"
								? "border-indigo-600 border-b-2 text-indigo-600"
								: "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
						}`}
						onClick={() => setHelpTab("ios")}
						type="button"
					>
						<span className="flex items-center justify-center gap-2">
							<Zap className="h-4 w-4 fill-indigo-600 text-indigo-600" />{" "}
							{t("tabIos")}
						</span>
					</button>
				</div>

				{/* Modal Content */}
				<div className="custom-scrollbar overflow-y-auto p-8">
					{helpTab === "guide" ? (
						<div className="space-y-6">
							<div className="flex gap-4">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
									<Camera className="h-6 w-6" />
								</div>
								<div>
									<h3 className="font-bold text-slate-800">
										{t("guideScanTitle")}
									</h3>
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
									<h3 className="font-bold text-slate-800">
										{t("guideGenTitle")}
									</h3>
									<p className="mt-1 text-slate-500 text-sm leading-relaxed">
										{t("guideGenDesc")}
									</p>
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-6">
							<div className="text-center">
								<h3 className="font-bold text-slate-800 text-xl tracking-tight">
									{t("iosTitle")}
								</h3>
								<p className="mt-2 text-slate-500 text-sm">
									{t("iosDesc")}
								</p>
							</div>

							<div className="group relative flex flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 transition-all hover:shadow-lg">
								<div className="mb-6 flex flex-col gap-4 sm:flex-row">
									<div className="flex-1 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
										<div className="mb-3 flex items-center gap-2">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
												<Upload className="h-4 w-4" />
											</div>
											<span className="font-bold text-slate-700 text-sm">
												{t("shortcut1Title")}
											</span>
										</div>
										<p className="text-slate-500 text-xs leading-relaxed">
											{t("shortcut1Desc")}
										</p>
									</div>

									<div className="flex-1 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
										<div className="mb-3 flex items-center gap-2">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
												<Zap className="h-4 w-4" />
											</div>
											<span className="font-bold text-slate-700 text-sm">
												{t("shortcut2Title")}
											</span>
										</div>
										<p className="text-slate-500 text-xs leading-relaxed">
											{t("shortcut2Desc")}
										</p>
									</div>
								</div>

								<div className="flex flex-col items-center gap-4 border-slate-200/50 border-t pt-6">
									<div className="rounded-xl border-4 border-white bg-white p-2 shadow-sm">
										<QRCodeSVG
											level="M"
											size={140}
											value="https://www.icloud.com/shortcuts/example-unified-workflow"
										/>
									</div>
									<div className="text-center">
										<p className="mb-3 font-medium text-slate-500 text-xs">
											{t("getShortcut")}
										</p>
										<a
											className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 font-bold text-sm text-white shadow-xl transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
											href="https://www.icloud.com/shortcuts/example-unified-workflow"
											rel="noopener noreferrer"
											target="_blank"
										>
											<Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span>Download Workflow</span>
										</a>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
