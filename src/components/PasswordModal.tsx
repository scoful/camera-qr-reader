import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface PasswordModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
	value: string;
	onChange: (val: string) => void;
}

export default function PasswordModal({
	isOpen,
	onClose,
	onSubmit,
	value,
	onChange,
}: PasswordModalProps) {
	const t = useTranslations("Index");
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
				<div className="mb-4 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
						<Lock className="h-5 w-5" />
					</div>
					<h3 className="font-bold text-lg text-slate-800">
						{t("authModalTitle")}
					</h3>
				</div>
				<p className="mb-4 text-slate-500 text-sm">{t("authModalDesc")}</p>
				<input
					className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && onSubmit()}
					placeholder={t("authModalPlaceholder")}
					type="password"
					value={value}
				/>
				<div className="flex justify-end gap-3">
					<button
						className="rounded-lg px-4 py-2 font-medium text-slate-500 hover:bg-slate-100"
						onClick={onClose}
						type="button"
					>
						{t("commonCancel")}
					</button>
					<button
						className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-indigo-500/20 shadow-lg hover:bg-indigo-700"
						onClick={onSubmit}
						type="button"
					>
						{t("commonConfirm")}
					</button>
				</div>
			</div>
		</div>
	);
}
