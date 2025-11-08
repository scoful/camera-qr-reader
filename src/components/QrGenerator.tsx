import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QrGeneratorProps {
	onGenerate: (value: string) => void;
}

export default function QrGenerator({ onGenerate }: QrGeneratorProps) {
	const [inputText, setInputText] = useState("");
	const qrRef = useRef<HTMLDivElement>(null);

	const handleGenerate = () => {
		if (inputText.trim()) {
			onGenerate(inputText.trim());
		}
	};

	const handleClear = () => {
		setInputText("");
	};

	return (
		<div className="w-full max-w-2xl flex flex-col justify-center gap-6">
			{/* 输入区域 */}
			<div>
				<label className="block mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
					<span className="text-lg">✍️</span>
					输入文本或URL
				</label>
				<textarea
					className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white transition-all"
					placeholder="输入要生成二维码的文本或链接..."
					rows={10}
					value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && e.ctrlKey) {
							handleGenerate();
						}
					}}
				/>
				<p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
					<span>💡</span>
					<span>提示: 按 Ctrl + Enter 快速生成</span>
				</p>
			</div>

			{/* 按钮组 */}
			<div className="flex gap-3">
				<button
					className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3.5 font-semibold text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					disabled={!inputText.trim()}
					onClick={handleGenerate}
					type="button"
				>
					生成二维码
				</button>
				{inputText && (
					<button
						className="rounded-xl bg-gray-100 px-6 py-3.5 font-semibold text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
						onClick={handleClear}
						type="button"
					>
						清空
					</button>
				)}
			</div>
		</div>
	);
}

