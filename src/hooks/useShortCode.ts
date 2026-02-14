import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function useShortCode() {
	const t = useTranslations("Index");
	const [useShortCodeEnabled, setUseShortCodeEnabled] = useState(false);
	const [isShortening, setIsShortening] = useState(false);

	const generateWithShortCode = async (
		inputUrl: string,
		onSuccess: (shortUrl: string) => void,
		onNeedPassword: () => void,
	) => {
		if (!inputUrl || isShortening) return;

		const storedPwd = localStorage.getItem("access_password");
		if (!storedPwd) {
			onNeedPassword();
			return;
		}

		setIsShortening(true);
		try {
			const res = await fetch("/api/shorten", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-access-password": storedPwd,
				},
				body: JSON.stringify({ content: inputUrl }),
			});

			if (res.status === 401) {
				localStorage.removeItem("access_password");
				onNeedPassword();
				setIsShortening(false);
				return;
			}

			if (!res.ok) throw new Error("Shorten failed");
			const { shortUrl } = await res.json();
			onSuccess(shortUrl);
		} catch (err) {
			console.error("Shorten failed:", err);
			toast.error(t("shorteningFailed"));
		} finally {
			setIsShortening(false);
		}
	};

	return {
		useShortCodeEnabled,
		setUseShortCodeEnabled,
		isShortening,
		generateWithShortCode,
	};
}
