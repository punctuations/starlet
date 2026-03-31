"use client";

import { useState } from "react";
import Terminal from "./components/Terminal";
import Registers from "./components/Registers";
import MemoryMap from "./components/MemoryMap";
import IOSPanel from "./components/IOSPanel";
import { useSimulator } from "./components/useSimulator";

type Tab = "terminal" | "registers" | "memmap" | "ios";

const TABS: { id: Tab; label: string }[] = [
	{ id: "terminal", label: "Terminal" },
	{ id: "registers", label: "Registers" },
	{ id: "memmap", label: "Memory Map" },
	{ id: "ios", label: "IOS / Refs" },
];

const QUICK_CMDS = [
	{ label: "help", cmd: "help" },
	{ label: "regs", cmd: "regs" },
	{ label: "memmap", cmd: "memmap" },
	{ label: "ios", cmd: "ios" },
	{ label: "boot2", cmd: "boot2" },
	{ label: "ahbprot", cmd: "ahbprot" },
	{ label: "srnprot", cmd: "srnprot" },
	{ label: "gpio read", cmd: "gpio read" },
	{ label: "trucha", cmd: "exploit trucha" },
	{ label: "fakesign", cmd: "exploit fakesign" },
	{ label: "nandbin", cmd: "exploit nandbin" },
	{ label: "ahbprot unlock", cmd: "exploit ahbprot" },
];

export default function Home() {
	const [tab, setTab] = useState<Tab>("terminal");
	const { state, runCmd, historyNav } = useSimulator();

	const handleQuick = (cmd: string) => {
		setTab("terminal");
		runCmd(cmd);
	};

	return (
		<div
			className="h-screen flex flex-col"
			style={{
				background: "#060810",
				color: "#d1d5db",
				fontFamily: "monospace",
			}}
		>
			<header
				className="flex items-center justify-between px-5 py-3 border-b shrink-0"
				style={{ borderColor: "#1f2937", background: "#080b12" }}
			>
				<div className="flex items-center gap-3">
					<div
						className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
						style={{
							background: "#1a2a1a",
							color: "#22c55e",
							border: "1px solid #22c55e33",
						}}
					>
						W
					</div>
					<span className="text-sm font-mono" style={{ color: "#d1d5db" }}>
						Hollywood SoC Simulator
					</span>
					<span
						className="text-xs font-mono px-1.5 py-0.5 rounded"
						style={{
							background: "#0f2010",
							color: "#22c55e",
							border: "1px solid #22c55e44",
						}}
					>
						v0.1
					</span>
				</div>

				<div className="flex items-center gap-4">
					<button
						onClick={() => runCmd("ctx starlet")}
						className="text-xs font-mono px-2 py-1 rounded border transition-colors"
						style={{
							borderColor: state.ctx === "starlet" ? "#22c55e" : "#1f2937",
							color: state.ctx === "starlet" ? "#22c55e" : "#374151",
							background: state.ctx === "starlet" ? "#052e1a" : "transparent",
						}}
					>
						Starlet ARM
					</button>
					<button
						onClick={() => runCmd("ctx broadway")}
						className="text-xs font-mono px-2 py-1 rounded border transition-colors"
						style={{
							borderColor: state.ctx === "broadway" ? "#60a5fa" : "#1f2937",
							color: state.ctx === "broadway" ? "#60a5fa" : "#374151",
							background: state.ctx === "broadway" ? "#051a30" : "transparent",
						}}
					>
						Broadway PPC
					</button>
					<div className="flex items-center gap-1.5">
						<div
							className="w-2 h-2 rounded-full"
							style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
						/>
						<span className="text-xs" style={{ color: "#374151" }}>
							running
						</span>
					</div>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				<aside
					className="w-40 shrink-0 border-r flex flex-col"
					style={{ borderColor: "#1f2937", background: "#080b12" }}
				>
					<p className="px-3 py-2 text-xs" style={{ color: "#374151" }}>
						QUICK RUN
					</p>
					<div className="flex-1 overflow-y-auto">
						{QUICK_CMDS.map((q) => (
							<button
								key={q.cmd}
								onClick={() => handleQuick(q.cmd)}
								className="w-full text-left px-3 py-1.5 text-xs font-mono border-b transition-colors hover:text-green-400"
								style={{
									borderColor: "#111827",
									color: "#6b7280",
									background: "transparent",
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.color = "#22c55e";
									(e.currentTarget as HTMLElement).style.background = "#052e1a";
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.color = "#6b7280";
									(e.currentTarget as HTMLElement).style.background =
										"transparent";
								}}
							>
								{q.label}
							</button>
						))}
					</div>
				</aside>

				<main className="flex-1 flex flex-col overflow-hidden">
					<div
						className="flex border-b shrink-0"
						style={{ borderColor: "#1f2937", background: "#080b12" }}
					>
						{TABS.map((t) => (
							<button
								key={t.id}
								onClick={() => setTab(t.id)}
								className="px-5 py-2.5 text-xs font-mono border-b-2 transition-colors"
								style={{
									borderColor:
										tab === t.id
											? t.id === "terminal"
												? "#22c55e"
												: "#60a5fa"
											: "transparent",
									color: tab === t.id ? "#d1d5db" : "#374151",
									background: "transparent",
								}}
							>
								{t.label}
							</button>
						))}
					</div>

					<div className="flex-1 overflow-hidden min-h-0">
						{tab === "terminal" && (
							<Terminal
								lines={state.lines}
								ctx={state.ctx}
								history={state.history}
								histIdx={state.histIdx}
								onRun={runCmd}
								onHistNav={historyNav}
							/>
						)}
						{tab === "registers" && <Registers state={state} />}
						{tab === "memmap" && <MemoryMap ctx={state.ctx} mem={state.mem} />}
						{tab === "ios" && <IOSPanel />}
					</div>
				</main>

				<aside
					className="w-52 shrink-0 border-l flex flex-col overflow-y-auto"
					style={{ borderColor: "#1f2937", background: "#080b12" }}
				>
					<p
						className="px-3 py-2 text-xs shrink-0"
						style={{ color: "#374151" }}
					>
						{state.ctx === "starlet" ? "ARM REGS" : "PPC REGS"}
					</p>
					<div className="px-3 space-y-0.5 text-xs font-mono">
						{state.ctx === "starlet"
							? Object.entries(state.armRegs).map(([r, v]) => (
									<div
										key={r}
										className="flex justify-between py-0.5 border-b"
										style={{ borderColor: "#111827" }}
									>
										<span style={{ color: "#374151" }}>{r.toUpperCase()}</span>
										<span style={{ color: "#34d399" }}>{v.slice(-8)}</span>
									</div>
							  ))
							: ["r0", "r1", "r2", "r3", "r4", "r5", "pc", "lr", "ctr"].map(
									(r) => (
										<div
											key={r}
											className="flex justify-between py-0.5 border-b"
											style={{ borderColor: "#111827" }}
										>
											<span style={{ color: "#374151" }}>
												{r.toUpperCase()}
											</span>
											<span style={{ color: "#60a5fa" }}>
												{(state.ppcRegs[r] || "0x00000000").slice(-8)}
											</span>
										</div>
									),
							  )}
					</div>

					<div className="px-3 mt-4">
						<p className="text-xs mb-1" style={{ color: "#374151" }}>
							HW REGS
						</p>
						{[
							{ label: "SRNPROT", key: "0x0d800000" },
							{ label: "AHBPROT", key: "0x0d800060" },
							{ label: "GPIO_OUT", key: "0x0d806000" },
							{ label: "GPIO_IN", key: "0x0d806008" },
						].map((h) => (
							<div
								key={h.label}
								className="flex justify-between py-0.5 border-b text-xs font-mono"
								style={{ borderColor: "#111827" }}
							>
								<span style={{ color: "#374151" }}>{h.label}</span>
								<span style={{ color: "#c084fc" }}>
									{(state.mem[h.key] || "—").replace("0x", "").slice(-6)}
								</span>
							</div>
						))}
					</div>

					{state.ctx === "starlet" && (
						<div className="px-3 mt-4">
							<p className="text-xs mb-1" style={{ color: "#374151" }}>
								FLAGS
							</p>
							<div className="flex gap-1">
								{Object.entries(state.armFlags).map(([f, v]) => (
									<div
										key={f}
										className="flex-1 text-center py-1 rounded text-xs font-mono font-bold"
										style={{
											background: v ? "#052e1a" : "#0f1117",
											color: v ? "#22c55e" : "#1f2937",
											border: `1px solid ${v ? "#22c55e44" : "#1f2937"}`,
										}}
									>
										{f}
									</div>
								))}
							</div>
						</div>
					)}
				</aside>
			</div>

			<footer
				className="flex items-center gap-6 px-5 py-1.5 border-t text-xs font-mono shrink-0"
				style={{
					borderColor: "#1f2937",
					background: "#080b12",
					color: "#374151",
				}}
			>
				<span>
					ctx:{" "}
					<span
						style={{ color: state.ctx === "starlet" ? "#22c55e" : "#60a5fa" }}
					>
						{state.ctx}
					</span>
				</span>
				<span>
					pc:{" "}
					<span style={{ color: "#c084fc" }}>
						{state.ctx === "starlet" ? state.armRegs.pc : state.ppcRegs.pc}
					</span>
				</span>
				<span>
					sp:{" "}
					<span style={{ color: "#c084fc" }}>
						{state.ctx === "starlet"
							? state.armRegs.sp
							: state.ppcRegs.r1 || "0x00000000"}
					</span>
				</span>
				<span>
					flags:{" "}
					<span style={{ color: "#6b7280" }}>
						N={state.armFlags.N} Z={state.armFlags.Z} C={state.armFlags.C} V=
						{state.armFlags.V}
					</span>
				</span>
				<span className="ml-auto">
					Hollywood SoC Simulator — for homebrew / modding
				</span>
			</footer>
		</div>
	);
}
