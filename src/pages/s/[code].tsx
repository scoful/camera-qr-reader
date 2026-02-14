import type { GetServerSideProps } from "next";
import Head from "next/head";
import { resolveShortLink } from "@/lib/kv";

interface Props {
	content: string;
	type: "url" | "text";
}

export default function ShortLinkPage({ content, type }: Props) {
	// For text type, render a simple display page
	if (type === "text") {
		return (
			<>
				<Head>
					<title>Shared Content</title>
				</Head>
				<main className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6">
					<div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
						<p className="whitespace-pre-wrap break-all text-slate-800 leading-relaxed">
							{content}
						</p>
					</div>
				</main>
			</>
		);
	}

	// URL type should have been redirected by getServerSideProps
	return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const code = context.params?.code as string;

	try {
		const data = await resolveShortLink(code);

		if (!data) {
			return { notFound: true };
		}

		// URL type: redirect immediately
		if (data.type === "url") {
			return {
				redirect: {
					destination: data.content,
					permanent: false,
				},
			};
		}

		// Text type: render page
		return {
			props: {
				content: data.content,
				type: data.type,
			},
		};
	} catch {
		return { notFound: true };
	}
};
