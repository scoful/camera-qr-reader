import type { AppType } from "next/app";
import { useRouter } from "next/router";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";

import "@/styles/globals.css";

const MyApp: AppType<{ messages: AbstractIntlMessages }> = ({
	Component,
	pageProps,
}) => {
	const router = useRouter();

	return (
		<NextIntlClientProvider
			locale={router.locale}
			messages={pageProps.messages}
			timeZone="Asia/Shanghai"
		>
			<Component {...pageProps} />
		</NextIntlClientProvider>
	);
};

export default MyApp;
