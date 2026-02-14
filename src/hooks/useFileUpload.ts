import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MAX_UPLOAD_SIZE } from "@/config/constants";
import { getR2PublicUrl } from "@/utils/url";

interface UseFileUploadOptions {
	onQrValueChange: (value: string) => void;
	onInputUrlChange: (value: string) => void;
	onPasswordSuccess?: (password: string) => void;
}

export function useFileUpload({
	onQrValueChange,
	onInputUrlChange,
	onPasswordSuccess,
}: UseFileUploadOptions) {
	const t = useTranslations("Index");
	const [isUploading, setIsUploading] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const pendingFileRef = useRef<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const continueUpload = useCallback(
		async (file: File, password?: string) => {
			setIsUploading(true);
			try {
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};
				if (password) {
					headers["x-access-password"] = password;
				}

				const putRes = await fetch("/api/r2/presign", {
					method: "POST",
					headers,
					body: JSON.stringify({
						action: "put",
						key: file.name,
						contentType: file.type,
						size: file.size,
					}),
				});

				if (putRes.status === 401) {
					localStorage.removeItem("access_password");
					pendingFileRef.current = file;
					setShowPasswordModal(true);
					setIsUploading(false);
					return;
				}

				if (!putRes.ok) throw new Error("Failed to get upload URL");
				const { url: putUrl, key } = await putRes.json();

				const uploadRes = await fetch(putUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				if (!uploadRes.ok) throw new Error("Upload to R2 failed");

				const finalQrValue = getR2PublicUrl(key);
				onQrValueChange(finalQrValue);
				onInputUrlChange(finalQrValue);
				pendingFileRef.current = null;
			} catch (err) {
				console.error("Upload failed", err);
				toast.error(t("toastUploadFailed"));
			} finally {
				setIsUploading(false);
			}
		},
		[t, onQrValueChange, onInputUrlChange],
	);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > MAX_UPLOAD_SIZE) {
			toast.error(t("toastFileSizeLimit"));
			e.target.value = "";
			return;
		}

		const storedPwd = localStorage.getItem("access_password");
		if (storedPwd) {
			await continueUpload(file, storedPwd);
		} else {
			pendingFileRef.current = file;
			setShowPasswordModal(true);
		}

		e.target.value = "";
	};

	const handlePasswordSubmit = async () => {
		if (!passwordInput) return;

		try {
			const res = await fetch("/api/r2/presign", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-access-password": passwordInput,
				},
				body: JSON.stringify({ action: "verify", key: "auth-check" }),
			});

			if (res.status === 401) {
				toast.error(t("toastInvalidPassword"));
				return;
			}
			if (!res.ok) throw new Error("Verification failed");

			localStorage.setItem("access_password", passwordInput);
			setShowPasswordModal(false);

			if (pendingFileRef.current) {
				continueUpload(pendingFileRef.current, passwordInput);
			} else if (onPasswordSuccess) {
				onPasswordSuccess(passwordInput);
			} else {
				fileInputRef.current?.click();
			}
		} catch (err) {
			console.error(err);
			toast.error(t("toastValidationError"));
		}
	};

	const handleUploadClick = () => {
		if (isUploading) return;

		const storedPwd = localStorage.getItem("access_password");
		if (storedPwd) {
			fileInputRef.current?.click();
		} else {
			setShowPasswordModal(true);
		}
	};

	const handlePasteUpload = useCallback(
		async (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (const item of items) {
				if (item.type.startsWith("image/")) {
					e.preventDefault();
					const file = item.getAsFile();
					if (file) {
						if (file.size > MAX_UPLOAD_SIZE) {
							toast.error(t("toastFileSizeLimit"));
							return;
						}

						const ext = item.type.split("/")[1] || "png";
						const namedFile = new File(
							[file],
							`paste-${Date.now()}.${ext}`,
							{ type: file.type },
						);

						const storedPwd = localStorage.getItem("access_password");
						if (storedPwd) {
							await continueUpload(namedFile, storedPwd);
						} else {
							pendingFileRef.current = namedFile;
							setShowPasswordModal(true);
						}
					}
					break;
				}
			}
		},
		[continueUpload, t],
	);

	return {
		isUploading,
		showPasswordModal,
		setShowPasswordModal,
		passwordInput,
		setPasswordInput,
		pendingFileRef,
		fileInputRef,
		handleFileUpload,
		handlePasswordSubmit,
		handleUploadClick,
		handlePasteUpload,
	};
}
