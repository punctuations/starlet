"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { TermLine, TermLineType } from "../lib/simulator";

interface TerminalProps {
	lines: TermLine[];
	ctx: "starlet" | "broadway";
	history: string[];
	histIdx: number;
	onRun: (cmd: string) => void;
	onHistNav: (dir: -1 | 1) => void;
}

const COLOR: Record<TermLineType, string> = {
	prompt: "#6b7280",
	ok: "#22c55e",
	err: "#ef4444",
	info: "#60a5fa",
	warn: "#f59e0b",
	addr: "#c084fc",
	data: "#34d399",
	sep: "#374151",
	plain: "#d1d5db",
};

export default function Terminal({
	lines,
	ctx,
	history,
	histIdx,
	onRun,
	onHistNav,
}: TerminalProps) {
	const [input, setInput] = useState("");
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [lines]);

	// Sync history navigation to input
	useEffect(() => {
		if (histIdx === -1) return;
		setInput(history[histIdx] ?? "");
	}, [histIdx, history]);

	const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			onRun(input);
			setInput("");
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			onHistNav(-1);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			onHistNav(1);
		} else if (e.key === "Tab") {
			e.preventDefault();
			// Simple tab complete
			const CMDS = [
				"help",
				"clear",
				"ctx",
				"regs",
				"setreg",
				"setflag",
				"read",
				"write",
				"dump",
				"memmap",
				"probe",
				"ahbprot",
				"srnprot",
				"gpio",
				"ios",
				"boot2",
				"aes",
				"sha1",
				"exploit",
				"reset",
			];
			const match = CMDS.find((c) => c.startsWith(input) && c !== input);
			if (match) setInput(match + " ");
		}
	};

	const prompt = ctx === "starlet" ? "[starlet]>" : "[broadway]>";

	return (
		<div
			className="flex flex-col h-full"
			onClick={() => inputRef.current?.focus()}
		>
			{/* Output */}
			<div
				className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
				style={{ minHeight: 0 }}
			>
				{lines.map((l, i) => (
					<div key={i} style={{ color: COLOR[l.type], whiteSpace: "pre" }}>
						{l.text}
					</div>
				))}
				<div ref={bottomRef} />
			</div>

			{/* Input row */}
			<div
				className="flex items-center gap-2 border-t px-4 py-2"
				style={{ borderColor: "#1f2937", background: "#0a0c0f" }}
			>
				<span
					className="font-mono text-xs shrink-0"
					style={{ color: ctx === "starlet" ? "#22c55e" : "#60a5fa" }}
				>
					{prompt}
				</span>
				<input
					ref={inputRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKey}
					autoFocus
					autoComplete="off"
					spellCheck={false}
					className="flex-1 bg-transparent outline-none font-mono text-xs"
					style={{ color: "#e5e7eb", caretColor: "#22c55e" }}
					placeholder="type a command…"
				/>
				<button
					onClick={() => {
						onRun(input);
						setInput("");
					}}
					className="text-xs px-3 py-1 rounded border font-mono transition-colors"
					style={{ borderColor: "#374151", color: "#6b7280" }}
					onMouseEnter={(e) => {
						(e.target as HTMLElement).style.borderColor = "#22c55e";
						(e.target as HTMLElement).style.color = "#22c55e";
					}}
					onMouseLeave={(e) => {
						(e.target as HTMLElement).style.borderColor = "#374151";
						(e.target as HTMLElement).style.color = "#6b7280";
					}}
				>
					run ↵
				</button>
			</div>
		</div>
	);
}
