import { Shrink, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

interface GenerateTabProps {
	inputUrl: string;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	useShortCode: boolean;
	onShortCodeToggle: (enabled: boolean) => void;
	isShortening: boolean;
	onGenerateShortCode: () => void;
	isUploading: boolean;
	onUploadClick: () => void;
	onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function GenerateTab({
	inputUrl,
	onInputChange,
	useShortCode,
	onShortCodeToggle,
	isShortening,
	onGenerateShortCode,
	isUploading,
	onUploadClick,
	onFileUpload,
	fileInputRef,
}: GenerateTabProps) {
	const t = useTranslations("Index");

	return (
		<div className="h flex flex-1 flex-col items-center justify-center p-12">
			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-4">
					{/* Input Field */}
					<div>
						<label
							className="mb-2 block font-semibold text-slate-700 text-sm"
							htmlFor="urlInput"
						>
							{t("inputLabel")}
						</label>
						<input
							className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
							id="urlInput"
							onChange={onInputChange}
							placeholder={t("inputPlaceholder")}
							type="text"
							value={inputUrl}
						/>
					</div>

					{/* Short Code Toggle + Generate Button */}
					<div className="flex items-center justify-between">
						<label className="flex cursor-pointer items-center gap-2">
							<div className="relative">
								<input
									checked={useShortCode}
									className="peer sr-only"
									onChange={(e) => onShortCodeToggle(e.target.checked)}
									type="checkbox"
								/>
								<div className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-indigo-600" />
								<div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
							</div>
							<div className="flex items-center gap-1">
								<Shrink className="h-3.5 w-3.5 text-slate-400" />
								<span className="font-medium text-slate-600 text-xs">
									{t("useShortCode")}
								</span>
							</div>
						</label>
						{useShortCode && (
							<button
								className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-sm text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
								disabled={!inputUrl || isShortening}
								onClick={onGenerateShortCode}
								type="button"
							>
								{isShortening ? (
									<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
								) : (
									<Shrink className="h-3.5 w-3.5" />
								)}
								{t("generateShortCode")}
							</button>
						)}
					</div>
				</div>

				<div className="relative flex items-center py-6">
					<div className="grow border-slate-200 border-t" />
					<span className="shrink-0 px-3 text-slate-400 text-xs uppercase">
						{t("orUpload")}
					</span>
					<div className="grow border-slate-200 border-t" />
				</div>

				{/* File Upload Area */}
				<div>
					{/* biome-ignore lint/a11y/useSemanticElements: Custom file upload trigger */}
					<div
						className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-slate-300 border-dashed bg-slate-50 py-8 transition-all hover:border-indigo-300 hover:bg-slate-100"
						onClick={onUploadClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								onUploadClick();
							}
						}}
						role="button"
						tabIndex={0}
					>
						<div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
							{isUploading ? (
								<div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
							) : (
								<div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200">
									<Upload className="h-6 w-6 text-indigo-500" />
								</div>
							)}
							<p className="mb-1 font-medium text-slate-700">
								{isUploading ? t("uploading") : t("clickToUpload")}
							</p>
							<p className="max-w-[200px] text-slate-400 text-xs">
								{t("uploadHint")}
							</p>
						</div>
						<input
							className="hidden"
							disabled={isUploading}
							onChange={onFileUpload}
							ref={fileInputRef}
							type="file"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
