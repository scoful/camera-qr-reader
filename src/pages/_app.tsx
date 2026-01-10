import type { AppType } from "next/app";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/router";

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
	const router = useRouter();

	return (
		<NextIntlClientProvider
			locale={router.locale}
			timeZone="Asia/Shanghai"
			messages={pageProps.messages}
		>
			<Component {...pageProps} />
		</NextIntlClientProvider>
	);
};

export default MyApp;
