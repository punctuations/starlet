"use client";

import { useCallback, useRef, useState } from "react";
import {
  COMMANDS,
  CpuContext,
  HW_REGS,
  IOS_MODS,
  lookupRegion,
  makeArmRegs,
  makePpcRegs,
  makeSimMem,
  MEM_ARM,
  MEM_PPC,
  parseHex,
  pseudoAES,
  pseudoSHA1,
  TermLine,
  TermLineType,
  toHex32,
} from "../lib/simulator";

// ─── Line builder helpers ──────────────────────────────────────────────────────

function line(type: TermLineType, text: string): TermLine {
  return { type, text };
}
function info(text: string): TermLine {
  return line("info", text);
}
function ok(text: string): TermLine {
  return line("ok", text);
}
function err(text: string): TermLine {
  return line("err", text);
}
function warn(text: string): TermLine {
  return line("warn", text);
}
function sep(text = "──────────────────────────────────────────"): TermLine {
  return line("sep", text);
}
function plain(text: string): TermLine {
  return line("plain", text);
}
function addr(text: string): TermLine {
  return line("addr", text);
}
function data(text: string): TermLine {
  return line("data", text);
}

// ─── State types ──────────────────────────────────────────────────────────────

export interface SimState {
  ctx: CpuContext;
  armRegs: Record<string, string>;
  ppcRegs: Record<string, string>;
  armFlags: { N: number; Z: number; C: number; V: number };
  armCPSR: { mode: string; T: number; F: number; I: number };
  mem: Record<string, string>;
  lines: TermLine[];
  history: string[];
  histIdx: number;
}

export function useSimulator() {
  const [state, setState] = useState<SimState>({
    ctx: "starlet",
    armRegs: makeArmRegs(),
    ppcRegs: makePpcRegs(),
    armFlags: { N: 0, Z: 1, C: 0, V: 0 },
    armCPSR: { mode: "SVC", T: 0, F: 0, I: 0 },
    mem: makeSimMem(),
    lines: [
      info("Hollywood SoC Research Simulator v0.1"),
      info("Starlet ARM926EJ-S + Broadway PowerPC 750CL"),
      sep(),
      plain("Type  help  for available commands."),
      plain("Context: starlet (IOS ARM)"),
      sep(),
    ],
    history: [],
    histIdx: -1,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const emit = useCallback((newLines: TermLine[]) => {
    setState((s) => ({ ...s, lines: [...s.lines, ...newLines].slice(-500) }));
  }, []);

  const runCmd = useCallback((raw: string) => {
    const s = stateRef.current;
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Add to history
    const newHistory = [trimmed, ...s.history.filter((h) => h !== trimmed)]
      .slice(0, 100);

    const promptLabel = s.ctx === "starlet" ? "[starlet]>" : "[broadway]>";
    const outLines: TermLine[] = [
      { type: "prompt", text: `${promptLabel} ${trimmed}` },
    ];

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    const addLines = (ls: TermLine[]) => outLines.push(...ls);

    // ── Commands ──────────────────────────────────────────────────────────────

    if (cmd === "clear") {
      setState((s2) => ({
        ...s2,
        lines: [],
        history: newHistory,
        histIdx: -1,
      }));
      return;
    }

    if (cmd === "help") addLines(cmdHelp());
    else if (cmd === "regs") addLines(cmdRegs(s));
    else if (cmd === "memmap") addLines(cmdMemmap(s.ctx));
    else if (cmd === "ios") addLines(cmdIOS());
    else if (cmd === "boot2") addLines(cmdBoot2());
    else if (cmd === "ahbprot") addLines(cmdAHBPROT(s));
    else if (cmd === "srnprot") addLines(cmdSRNPROT(s));
    else if (cmd === "gpio") addLines(cmdGPIO(parts, s));
    else if (cmd === "read") addLines(cmdRead(parts, s));
    else if (cmd === "write") addLines(cmdWrite(parts, s));
    else if (cmd === "dump") addLines(cmdDump(parts, s));
    else if (cmd === "probe") addLines(cmdProbe(parts, s));
    else if (cmd === "setreg") addLines(cmdSetReg(parts, s));
    else if (cmd === "setflag") addLines(cmdSetFlag(parts, s));
    else if (cmd === "aes") addLines(cmdAES(parts));
    else if (cmd === "sha1") addLines(cmdSHA1(parts));
    else if (cmd === "exploit") addLines(cmdExploit(parts, s));
    else if (cmd === "reset") addLines(cmdReset(parts));
    else if (cmd === "ctx") addLines(cmdCtx(parts));
    else {addLines([
        err(`Unknown command: "${cmd}". Type help for available commands.`),
      ]);}

    outLines.push(sep());

    // Handle side-effects that mutate state
    if (cmd === "ctx" && (parts[1] === "starlet" || parts[1] === "broadway")) {
      setState((s2) => ({
        ...s2,
        ctx: parts[1] as CpuContext,
        lines: [...s2.lines, ...outLines].slice(-500),
        history: newHistory,
        histIdx: -1,
      }));
    } else if (cmd === "write" && parts[1] && parts[2]) {
      const key = parts[1].toLowerCase();
      const val = parts[2].startsWith("0x") ? parts[2] : "0x" + parts[2];
      setState((s2) => ({
        ...s2,
        mem: { ...s2.mem, [key]: val.toUpperCase() },
        lines: [...s2.lines, ...outLines].slice(-500),
        history: newHistory,
        histIdx: -1,
      }));
    } else if (cmd === "setreg" && parts[1] && parts[2]) {
      const regName = parts[1].toLowerCase();
      const val = parts[2].startsWith("0x") ? parts[2] : "0x" + parts[2];
      if (s.ctx === "starlet") {
        setState((s2) => ({
          ...s2,
          armRegs: { ...s2.armRegs, [regName]: val.toUpperCase() },
          lines: [...s2.lines, ...outLines].slice(-500),
          history: newHistory,
          histIdx: -1,
        }));
      } else {
        setState((s2) => ({
          ...s2,
          ppcRegs: { ...s2.ppcRegs, [regName]: val.toUpperCase() },
          lines: [...s2.lines, ...outLines].slice(-500),
          history: newHistory,
          histIdx: -1,
        }));
      }
    } else if (cmd === "setflag" && parts[1] && parts[2] !== undefined) {
      const flag = parts[1].toUpperCase() as "N" | "Z" | "C" | "V";
      const val = parseInt(parts[2]);
      if (["N", "Z", "C", "V"].includes(flag) && (val === 0 || val === 1)) {
        setState((s2) => ({
          ...s2,
          armFlags: { ...s2.armFlags, [flag]: val },
          lines: [...s2.lines, ...outLines].slice(-500),
          history: newHistory,
          histIdx: -1,
        }));
      } else {
        setState((s2) => ({
          ...s2,
          lines: [...s2.lines, ...outLines].slice(-500),
          history: newHistory,
          histIdx: -1,
        }));
      }
    } else if (
      cmd === "gpio" && parts[1] === "set" && parts[2] && parts[3] !== undefined
    ) {
      const pin = parseInt(parts[2]);
      const val = parseInt(parts[3]);
      if (!isNaN(pin) && (val === 0 || val === 1)) {
        const curOut = parseHex(s.mem["0x0d806000"] || "0x00000000");
        const next = val ? (curOut | (1 << pin)) : (curOut & ~(1 << pin));
        setState((s2) => ({
          ...s2,
          mem: { ...s2.mem, "0x0d806000": toHex32(next) },
          lines: [...s2.lines, ...outLines].slice(-500),
          history: newHistory,
          histIdx: -1,
        }));
      } else {
        setState((s2) => ({
          ...s2,
          lines: [...s2.lines, ...outLines].slice(-500),
          history: newHistory,
          histIdx: -1,
        }));
      }
    } else {
      setState((s2) => ({
        ...s2,
        lines: [...s2.lines, ...outLines].slice(-500),
        history: newHistory,
        histIdx: -1,
      }));
    }
  }, []);

  const historyNav = useCallback((dir: -1 | 1) => {
    setState((s) => {
      const next = Math.max(
        -1,
        Math.min(s.history.length - 1, s.histIdx + dir),
      );
      return { ...s, histIdx: next };
    });
  }, []);

  return { state, runCmd, historyNav, emit };
}

// ─── Command implementations ──────────────────────────────────────────────────

function cmdHelp(): TermLine[] {
  const categories = [...new Set(COMMANDS.map((c) => c.category))];
  const lines: TermLine[] = [info("Available commands:"), sep()];
  for (const cat of categories) {
    lines.push(plain(`  ${cat}`));
    for (const c of COMMANDS.filter((x) => x.category === cat)) {
      lines.push(plain(`    ${c.cmd.padEnd(32)} ${c.desc}`));
    }
  }
  return lines;
}

function cmdRegs(s: SimState): TermLine[] {
  if (s.ctx === "starlet") {
    const lines: TermLine[] = [info("Starlet ARM926EJ-S — Register Dump")];
    const regs = s.armRegs;
    const names = Object.keys(regs);
    for (let i = 0; i < names.length; i += 2) {
      const a = names[i], b = names[i + 1];
      const la = `  ${a.padStart(3)} = ${regs[a]}`;
      const extra_a = a === "pc"
        ? "  ← instruction ptr"
        : a === "sp"
        ? "  ← stack pointer"
        : a === "lr"
        ? "  ← link register"
        : "";
      if (b) {
        lines.push(data(la + extra_a));
        lines.push(data(`  ${b.padStart(3)} = ${regs[b]}`));
      } else {
        lines.push(data(la + extra_a));
      }
    }
    lines.push(
      plain(
        `  CPSR: Mode=${s.armCPSR.mode} T=${s.armCPSR.T} F=${s.armCPSR.F} I=${s.armCPSR.I}`,
      ),
    );
    lines.push(
      plain(
        `  Flags: N=${s.armFlags.N} Z=${s.armFlags.Z} C=${s.armFlags.C} V=${s.armFlags.V}`,
      ),
    );
    return lines;
  } else {
    const lines: TermLine[] = [info("Broadway PowerPC 750CL — Register Dump")];
    const show = [
      "r0",
      "r1",
      "r2",
      "r3",
      "r4",
      "r5",
      "r6",
      "r7",
      "r8",
      "r9",
      "r10",
      "r11",
      "r12",
      "r13",
      "r14",
      "r15",
      "pc",
      "lr",
      "ctr",
      "xer",
    ];
    for (let i = 0; i < show.length; i += 2) {
      const a = show[i], b = show[i + 1];
      if (b) {
        lines.push(
          data(
            `  ${a.padEnd(4)} = ${s.ppcRegs[a] || "0x00000000"}    ${
              b.padEnd(4)
            } = ${s.ppcRegs[b] || "0x00000000"}`,
          ),
        );
      } else {
        lines.push(data(`  ${a.padEnd(4)} = ${s.ppcRegs[a] || "0x00000000"}`));
      }
    }
    return lines;
  }
}

function cmdMemmap(ctx: CpuContext): TermLine[] {
  const list = ctx === "starlet" ? MEM_ARM : MEM_PPC;
  const lines: TermLine[] = [
    info(
      `${
        ctx === "starlet" ? "Starlet ARM" : "Broadway PPC"
      } — Physical Memory Map`,
    ),
    plain("  Start        End          Size      Acc  Name"),
    sep("  ──────────────────────────────────────────────────────────"),
  ];
  for (const r of list) {
    lines.push(
      addr(
        `  ${r.start}  ${r.end}  ${r.size.padEnd(8)}  ${
          r.rw.padEnd(2)
        }   ${r.name}`,
      ),
    );
  }
  return lines;
}

function cmdIOS(): TermLine[] {
  const lines: TermLine[] = [
    info("IOS Slot Map — Installed Modules"),
    plain("  Slot  Name      Version   Flags  Description"),
    sep("  ────────────────────────────────────────────────────────────"),
  ];
  for (const m of IOS_MODS) {
    const flag = m.exploitable ? "⚠ vuln" : "      ";
    lines.push(
      plain(
        `  ${m.slot.padEnd(5)} ${m.name.padEnd(9)} ${
          m.ver.padEnd(9)
        } ${flag}  ${m.desc}`,
      ),
    );
  }
  lines.push(
    warn("  ⚠  IOS36 is a common target for Trucha / fakesign exploits."),
  );
  return lines;
}

function cmdBoot2(): TermLine[] {
  return [
    info("Wii Boot Chain"),
    sep(),
    plain("  Stage 0  Boot ROM @ 0x0D010000 (Starlet SRAM, masked after init)"),
    plain("           Verifies boot1 RSA-2048 signature via Starlet hardware"),
    plain(""),
    plain("  Stage 1  boot1 @ NAND (read by NAND controller @ 0x0D840000)"),
    plain("           Verifies boot2, configures SRNPROT to lock boot0 ROM"),
    plain(""),
    plain("  Stage 2  boot2 @ NAND block 0 (IOS slot 254 — BC layer)"),
    plain("           Loads System Menu IOS, hands off execution to Broadway"),
    plain(""),
    plain("  Broadway Boots from 0xFFF00000 (mapped BROM mirror)"),
    warn(
      "  SRNPROT @ 0x0D800000 masks boot0 after stage 0 — unreadable thereafter.",
    ),
    warn(
      "  AHBPROT @ 0x0D800060 locks HW peripherals to Starlet — Broadway blocked by default.",
    ),
  ];
}

function cmdAHBPROT(s: SimState): TermLine[] {
  const val = s.mem["0x0d800060"] || "0x00000000";
  const v = parseHex(val.replace("0x", ""));
  const lines: TermLine[] = [
    info(`AHB Protection Register @ 0x0D800060 = ${val}`),
    plain("  Bit  Peripheral  State"),
    sep("  ─────────────────────────────────────────────"),
  ];
  const peripherals = [
    "NAND",
    "AES",
    "SHA",
    "EHCI",
    "OHCI0",
    "OHCI1",
    "SD",
    "Wi-Fi",
  ];
  for (let b = 0; b < 8; b++) {
    const set = (v >> b) & 1;
    const state = set
      ? "OPEN  — Broadway can access directly"
      : "LOCKED — Starlet only";
    lines.push(
      set
        ? ok(`  bit${b}  ${peripherals[b].padEnd(6)}      ${state}`)
        : warn(`  bit${b}  ${peripherals[b].padEnd(6)}      ${state}`),
    );
  }
  if (v === 0) {
    lines.push(
      warn(
        "  All bits locked — Broadway cannot access HW peripherals directly (normal IOS mode).",
      ),
    );
  } else {lines.push(
      ok(
        "  Some bits open — Broadway has direct HW access (post-exploit state).",
      ),
    );}
  return lines;
}

function cmdSRNPROT(s: SimState): TermLine[] {
  const val = s.mem["0x0d800000"] || "0x0000FFFF";
  return [
    info(`SRNPROT @ 0x0D800000 = ${val}`),
    plain("  Controls visibility of Starlet SRAM regions to the Broadway bus."),
    ok("  0x0D400000 – 0x0D43FFFF  →  accessible (IOS SRAM)"),
    err("  0x0D010000 – 0x0D01FFFF  →  boot0 ROM masked — not readable"),
    warn(
      "  Modifying SRNPROT from Broadway requires an AHBPROT exploit first.",
    ),
  ];
}

function cmdGPIO(parts: string[], s: SimState): TermLine[] {
  if (!parts[1] || parts[1] === "read") {
    const v = parseHex((s.mem["0x0d806008"] || "0x0000003C").replace("0x", ""));
    const lines: TermLine[] = [info(`GPIO Input @ 0x0D806008 = ${toHex32(v)}`)];
    const labels: Record<number, string> = {
      2: "power button",
      3: "disc eject",
      4: "sensor bar",
      5: "slot light",
    };
    for (let i = 0; i < 8; i++) {
      const hi = (v >> i) & 1;
      const lbl = labels[i] ? `  (${labels[i]})` : "";
      lines.push(
        hi ? ok(`  GPIO${i}  HIGH${lbl}`) : plain(`  GPIO${i}  LOW${lbl}`),
      );
    }
    return lines;
  }
  if (parts[1] === "set" && parts[2] !== undefined && parts[3] !== undefined) {
    const pin = parseInt(parts[2]);
    const val = parseInt(parts[3]);
    if (isNaN(pin) || pin < 0 || pin > 31) {
      return [err("Invalid pin number (0–31).")];
    }
    if (val !== 0 && val !== 1) return [err("Value must be 0 or 1.")];
    const curOut = parseHex(s.mem["0x0d806000"] || "0x00000000");
    const next = val ? (curOut | (1 << pin)) : (curOut & ~(1 << pin));
    return [
      ok(`GPIO${pin} set to ${val ? "HIGH" : "LOW"}`),
      data(`GPIO_OUT @ 0x0D806000 → ${toHex32(next)}`),
      ...(pin === 1 ? [warn("  Note: GPIO1 is sensor bar power.")] : []),
    ];
  }
  return [err("Usage: gpio read | gpio set <pin> <0|1>")];
}

function cmdRead(parts: string[], s: SimState): TermLine[] {
  if (!parts[1]) return [err("Usage: read <address>")];
  const addrStr = parts[1].toLowerCase();
  const region = lookupRegion(addrStr, s.ctx);
  const existing = s.mem[addrStr];
  const val = existing ?? toHex32(Math.floor(Math.random() * 0xFFFFFFFF));
  const lines: TermLine[] = [data(`  ${addrStr}  →  ${val}`)];
  if (region) lines.push(plain(`  Region: ${region.name} — ${region.desc}`));
  else {lines.push(
      warn("  Address not in a known region — may fault or bus error."),
    );}
  return lines;
}

function cmdWrite(parts: string[], s: SimState): TermLine[] {
  if (!parts[1] || !parts[2]) return [err("Usage: write <address> <value>")];
  const addrStr = parts[1].toLowerCase();
  const val = parts[2];
  const region = lookupRegion(addrStr, s.ctx);
  if (region?.rw === "R") {
    return [err(`Address ${addrStr} is read-only (${region.name}).`)];
  }
  return [
    ok(`Wrote ${val} → ${addrStr}`),
    ...(region
      ? [plain(`  Region: ${region.name}`)]
      : [warn("  Address not in a known region.")]),
  ];
}

function cmdDump(parts: string[], s: SimState): TermLine[] {
  if (!parts[1]) return [err("Usage: dump <address> <n>")];
  const base = parseHex(parts[1]);
  const count = Math.min(parseInt(parts[2]) || 64, 256);
  const lines: TermLine[] = [
    info(`Hex dump @ ${toHex32(base)} — ${count} bytes`),
  ];
  for (let row = 0; row < count; row += 16) {
    const rowAddr = toHex32(base + row);
    const bytes: string[] = [];
    const chars: string[] = [];
    for (let col = 0; col < 16 && row + col < count; col++) {
      const key = toHex32(base + row + col).toLowerCase();
      const word = parseHex(
        s.mem[key] || toHex32(Math.floor(Math.random() * 0xFF)),
      );
      const b = (word & 0xFF).toString(16).padStart(2, "0").toUpperCase();
      bytes.push(b);
      chars.push(
        parseInt(b, 16) >= 32 && parseInt(b, 16) < 127
          ? String.fromCharCode(parseInt(b, 16))
          : ".",
      );
    }
    lines.push(
      addr(`  ${rowAddr}  ${bytes.join(" ").padEnd(47)}  |${chars.join("")}|`),
    );
  }
  return lines;
}

function cmdProbe(parts: string[], s: SimState): TermLine[] {
  if (!parts[1]) return [err("Usage: probe <address>")];
  const addrStr = parts[1].toLowerCase();
  const region = lookupRegion(addrStr, s.ctx);
  const ahbprot = parseHex(s.mem["0x0d800060"] || "0x00000000");
  if (!region) {
    return [warn(`${addrStr}  →  UNMAPPED — likely to cause a bus fault.`)];
  }
  const lines: TermLine[] = [info(`Probing ${addrStr} — ${region.name}`)];
  lines.push(
    plain(`  Access: ${region.rw}    Size: ${region.size}    ${region.desc}`),
  );
  if (addrStr.startsWith("0x0d8") && s.ctx === "broadway" && ahbprot === 0) {
    lines.push(err("  Broadway access DENIED — AHBPROT bits are all locked."));
    lines.push(warn("  Run: exploit ahbprot  to simulate unlock sequence."));
  } else if (addrStr.startsWith("0x0d010")) {
    lines.push(err("  boot0 ROM masked by SRNPROT — read returns 0x00000000."));
  } else {
    lines.push(ok("  Access permitted for current context."));
  }
  return lines;
}

function cmdSetReg(parts: string[], s: SimState): TermLine[] {
  if (!parts[1] || !parts[2]) {
    return [err("Usage: setreg <register> <hex value>")];
  }
  const reg = parts[1].toLowerCase();
  const val = parts[2].startsWith("0x") ? parts[2] : "0x" + parts[2];
  const regs = s.ctx === "starlet" ? s.armRegs : s.ppcRegs;
  if (!(reg in regs)) return [err(`Unknown register: ${reg}`)];
  return [ok(`${reg} ← ${val.toUpperCase()}`)];
}

function cmdSetFlag(parts: string[], s: SimState): TermLine[] {
  if (s.ctx !== "starlet") {
    return [err("setflag only applies to Starlet ARM context.")];
  }
  if (!parts[1] || parts[2] === undefined) {
    return [err("Usage: setflag <N|Z|C|V> <0|1>")];
  }
  const flag = parts[1].toUpperCase();
  const val = parseInt(parts[2]);
  if (!["N", "Z", "C", "V"].includes(flag)) {
    return [err("Flag must be one of: N Z C V")];
  }
  if (val !== 0 && val !== 1) return [err("Value must be 0 or 1.")];
  return [ok(`CPSR flag ${flag} ← ${val}`)];
}

function cmdAES(parts: string[]): TermLine[] {
  if (!parts[1] || !parts[2]) return [err("Usage: aes <key_hex> <data_hex>")];
  const ct = pseudoAES(parts[1], parts[2]);
  return [
    info("AES-128 Simulation (display only — not real AES)"),
    plain(
      `  Key:        ${parts[1].toUpperCase().padEnd(32, "0").slice(0, 32)}`,
    ),
    plain(`  Plaintext:  ${parts[2].toUpperCase()}`),
    data(`  Ciphertext: ${ct}`),
    warn("  Use hardware AES engine @ 0x0D880000 for real crypto operations."),
  ];
}

function cmdSHA1(parts: string[]): TermLine[] {
  if (!parts[1]) return [err("Usage: sha1 <data_hex>")];
  const hash = pseudoSHA1(parts[1]);
  return [
    info("SHA-1 Simulation (display only)"),
    plain(`  Input:  ${parts[1]}`),
    data(`  Hash:   ${hash}`),
    warn("  Use hardware SHA-1 engine @ 0x0D8C0000 for real hashing."),
  ];
}

function cmdExploit(parts: string[], s: SimState): TermLine[] {
  const sub = parts[1]?.toLowerCase();
  if (!sub) return [err("Usage: exploit <trucha|fakesign|nandbin|ahbprot>")];

  if (sub === "trucha") {
    return [
      info("Trucha Bug — RSA Signature Verification Bypass"),
      sep(),
      plain("  The Trucha bug exploits a flaw in IOS signature verification."),
      plain(
        "  Nintendo's RSA check compared only the hash prefix, not the full sig.",
      ),
      plain("  Attackers could forge a ticket/TMD with a hash collision."),
      sep(),
      plain("  Affected: IOS < v3608 (IOS35 and earlier)"),
      warn(
        "  Simulation: checking IOS36 @ slot 36 for Trucha-patchable code...",
      ),
      ok(
        "  [SIM] Trucha-vulnerable code path detected at 0x0D400A40 (IOS SRAM).",
      ),
      ok(
        "  [SIM] RSA mod_exp returns 0 — fake signature would pass verification.",
      ),
      plain(
        "  Patch: replace 3-byte compare with 20-byte full digest comparison.",
      ),
    ];
  }

  if (sub === "fakesign") {
    return [
      info("Fakesign — Forged Ticket/TMD Generation"),
      sep(),
      plain("  Fakesign exploits the Trucha bug to sign arbitrary content."),
      plain("  Brute-forces a title / TMD until SHA-1 hash starts with 0x00."),
      plain(
        "  Combined with Trucha, this allows installing unsigned channels.",
      ),
      sep(),
      warn("  Simulation: generating fakesigned TMD..."),
      plain("  Iterations: 65,536   Final nonce: 0x000F3A1C"),
      ok("  [SIM] SHA-1(TMD) = 00A4C3E2...  ← leading null byte achieved"),
      ok(
        "  [SIM] Fakesign successful — would pass Trucha-vulnerable IOS check.",
      ),
    ];
  }

  if (sub === "nandbin") {
    return [
      info("NAND Layout Analysis"),
      sep(),
      plain("  Block 0        boot2 (encrypted, RSA signed)"),
      plain("  Block 1        boot2 backup"),
      plain("  Block 2–7      System menu"),
      plain("  Block 8–15     IOS0 / boot IOS stubs"),
      plain("  Block 16–4095  Titles, saves, installed channels"),
      sep(),
      plain("  NAND controller @ 0x0D840000"),
      plain("  Page size: 2048 bytes + 64 byte spare OOB"),
      plain("  Total: 512 MB, 4096 blocks, 64 pages/block"),
      warn("  boot2 blocks are write-protected by boot1 before handoff."),
      ok("  [SIM] NAND controller responds — status = 0x00 (ready)."),
    ];
  }

  if (sub === "ahbprot") {
    const current = parseHex(s.mem["0x0d800060"] || "0x00000000");
    if (current !== 0) {
      return [
        warn(
          "AHBPROT is already non-zero — peripherals may already be accessible.",
        ),
      ];
    }
    return [
      info("AHBPROT Unlock — Broadway Hardware Access Exploit"),
      sep(),
      plain(
        "  AHBPROT @ 0x0D800060 controls peripheral bus access from Broadway.",
      ),
      plain("  Default: 0x00000000 — all peripherals locked to Starlet."),
      sep(),
      warn(
        "  Simulation: triggering IOS54 disk image exploit to unlock AHBPROT...",
      ),
      plain("  Step 1: Load vulnerable IOS54 via IOCTL"),
      plain("  Step 2: Trigger heap overflow in ES module"),
      plain("  Step 3: Overwrite saved LR → redirect to payload"),
      plain("  Step 4: Payload writes 0xFFFFFFFF to 0x0D800060"),
      ok("  [SIM] AHBPROT = 0xFFFFFFFF — all peripheral bits now open."),
      ok(
        "  [SIM] Broadway can now directly access: NAND AES SHA EHCI OHCI SD Wi-Fi",
      ),
      warn("  Run: ahbprot   to verify new register state."),
    ];
  }

  return [
    err(`Unknown exploit: "${sub}". Options: trucha fakesign nandbin ahbprot`),
  ];
}

function cmdReset(parts: string[]): TermLine[] {
  const sub = parts[1]?.toLowerCase();
  if (sub === "soft") {
    return [
      info("Soft Reset Sequence"),
      plain("  1. Broadway signals PI soft reset via 0x0C003000"),
      plain("  2. Starlet receives IPC message: RESET_REQUEST"),
      plain("  3. IOS shuts down USB, SD, Wi-Fi modules"),
      plain("  4. System Menu reloads from NAND"),
      ok("  [SIM] Reset signal sent. System would restart."),
    ];
  }
  return [err("Usage: reset soft")];
}

function cmdCtx(parts: string[]): TermLine[] {
  const target = parts[1]?.toLowerCase();
  if (target !== "starlet" && target !== "broadway") {
    return [err("Usage: ctx <starlet|broadway>")];
  }
  return [
    ok(`Switched context to ${
      target === "starlet"
        ? "Starlet ARM926EJ-S (IOS)"
        : "Broadway PowerPC 750CL"
    }`),
  ];
}
