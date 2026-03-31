// ─── Types ────────────────────────────────────────────────────────────────────

export type CpuContext = 'starlet' | 'broadway';
export type TermLineType = 'prompt' | 'ok' | 'err' | 'info' | 'warn' | 'addr' | 'data' | 'sep' | 'plain';

export interface TermLine {
  type: TermLineType;
  text: string;
  spans?: { text: string; type: TermLineType }[];
}

export interface MemRegion {
  start: string;
  end: string;
  size: string;
  name: string;
  rw: 'R' | 'W' | 'RW';
  desc: string;
}

export interface IOSModule {
  slot: string;
  name: string;
  ver: string;
  perms: string;
  desc: string;
  exploitable?: boolean;
}

export interface HWReg {
  addr: string;
  name: string;
  desc: string;
}

export interface CommandDef {
  cmd: string;
  desc: string;
  category: string;
}

// ─── Memory Maps ──────────────────────────────────────────────────────────────

export const MEM_ARM: MemRegion[] = [
  { start: '0x00000000', end: '0x017FFFFF', size: '24 MB',  name: 'MEM1 (GDDR3)',          rw: 'RW', desc: 'Main RAM, shared with Broadway' },
  { start: '0x10000000', end: '0x13FFFFFF', size: '64 MB',  name: 'MEM2 (GDDR3)',          rw: 'RW', desc: 'Extended RAM (system / IOS)' },
  { start: '0x0D010000', end: '0x0D01FFFF', size: '64 KB',  name: 'Starlet boot0 ROM',     rw: 'R',  desc: 'Boot ROM — masked after stage 0 init' },
  { start: '0x0D400000', end: '0x0D43FFFF', size: '256 KB', name: 'Starlet SRAM',          rw: 'RW', desc: 'IOS working SRAM' },
  { start: '0x0D800000', end: '0x0D8003FF', size: '1 KB',   name: 'Hollywood regs (AHB)',  rw: 'RW', desc: 'SoC config and control registers' },
  { start: '0x0D806000', end: '0x0D8063FF', size: '1 KB',   name: 'GPIO / Spare regs',     rw: 'RW', desc: 'GPIO, power control' },
  { start: '0x0D840000', end: '0x0D87FFFF', size: '256 KB', name: 'NAND controller',       rw: 'RW', desc: 'Flash NAND interface' },
  { start: '0x0D880000', end: '0x0D8803FF', size: '1 KB',   name: 'AES engine',            rw: 'RW', desc: 'Hardware crypto accelerator' },
  { start: '0x0D8C0000', end: '0x0D8C03FF', size: '1 KB',   name: 'SHA-1 engine',          rw: 'RW', desc: 'Hardware hash engine' },
  { start: '0x0D900000', end: '0x0D9FFFFF', size: '1 MB',   name: 'USB (OHCI/EHCI)',       rw: 'RW', desc: 'USB host controller' },
  { start: '0x0DA00000', end: '0x0DAFFFFF', size: '1 MB',   name: 'SD/MMC controller',     rw: 'RW', desc: 'SD card interface' },
  { start: '0x0DB00000', end: '0x0DBFFFFF', size: '1 MB',   name: 'Wi-Fi (BCM4318)',       rw: 'RW', desc: 'SDIO wireless bridge' },
  { start: '0x0DC00000', end: '0x0DCFFFFF', size: '1 MB',   name: 'EXI bus',               rw: 'RW', desc: 'Memory card / RTC bus' },
];

export const MEM_PPC: MemRegion[] = [
  { start: '0x00000000', end: '0x017FFFFF', size: '24 MB',  name: 'MEM1 (GDDR3)',          rw: 'RW', desc: 'Main game RAM' },
  { start: '0x10000000', end: '0x13FFFFFF', size: '64 MB',  name: 'MEM2 (GDDR3)',          rw: 'RW', desc: 'System / extended RAM' },
  { start: '0x0C000000', end: '0x0C00FFFF', size: '64 KB',  name: 'PI (Proc. Interface)',  rw: 'RW', desc: 'Broadway ↔ bus bridge' },
  { start: '0x0C003000', end: '0x0C0030FF', size: '256 B',  name: 'PI interrupt regs',     rw: 'RW', desc: 'IRQ control' },
  { start: '0x0C004000', end: '0x0C004FFF', size: '4 KB',   name: 'MI (Memory Interface)', rw: 'RW', desc: 'Memory controller' },
  { start: '0x0C006000', end: '0x0C006FFF', size: '4 KB',   name: 'DSP registers',         rw: 'RW', desc: 'Audio DSP control' },
  { start: '0x0C006C00', end: '0x0C006CFF', size: '256 B',  name: 'DI (Disc Interface)',   rw: 'RW', desc: 'DVD drive control' },
  { start: '0x0C006E00', end: '0x0C006EFF', size: '256 B',  name: 'SI (Serial Interface)', rw: 'RW', desc: 'GC controller ports' },
  { start: '0x0C006800', end: '0x0C0068FF', size: '256 B',  name: 'EI (EXI bus)',          rw: 'RW', desc: 'Memory card / RTC' },
  { start: '0xFFF00000', end: '0xFFFFFFFF', size: '1 MB',   name: 'BROM (boot ROM)',       rw: 'R',  desc: 'Broadway boot code' },
];

export const HW_REGS: HWReg[] = [
  { addr: '0x0D800000', name: 'SRNPROT',       desc: 'SRAM protection — controls boot0 visibility to Broadway' },
  { addr: '0x0D800060', name: 'AHBPROT',        desc: 'AHB bus protection bits — per-peripheral Broadway access' },
  { addr: '0x0D800180', name: 'CLOCKS',         desc: 'PLL clock configuration' },
  { addr: '0x0D80018C', name: 'RESETS',         desc: 'Peripheral reset bits' },
  { addr: '0x0D806000', name: 'GPIO_OUT',        desc: 'GPIO output register' },
  { addr: '0x0D806004', name: 'GPIO_DIR',        desc: 'GPIO direction register (0=in, 1=out)' },
  { addr: '0x0D806008', name: 'GPIO_IN',         desc: 'GPIO input register (read-only)' },
  { addr: '0x0D806010', name: 'GPIO_INTLEVEL',   desc: 'GPIO interrupt level trigger' },
  { addr: '0x0D840000', name: 'NAND_CTRL',       desc: 'NAND flash command / status' },
  { addr: '0x0D840008', name: 'NAND_CONF',       desc: 'NAND configuration register' },
  { addr: '0x0D880000', name: 'AES_CTRL',        desc: 'AES engine control register' },
  { addr: '0x0D880004', name: 'AES_SRC',         desc: 'AES source DMA address' },
  { addr: '0x0D880008', name: 'AES_DEST',        desc: 'AES destination DMA address' },
  { addr: '0x0D88000C', name: 'AES_KEY',         desc: 'AES key select / write register' },
  { addr: '0x0D8C0000', name: 'SHA_CTRL',        desc: 'SHA-1 engine control register' },
  { addr: '0x0D8C0004', name: 'SHA_SRC',         desc: 'SHA-1 source DMA address' },
];

export const IOS_MODS: IOSModule[] = [
  { slot: '0',   name: 'IOS0',   ver: '(boot2)',  perms: 'priv', desc: 'Minimal stub, no modules loaded',            exploitable: false },
  { slot: '21',  name: 'IOS21',  ver: 'v1088',    perms: 'priv', desc: 'Disc channel — DI access',                   exploitable: false },
  { slot: '31',  name: 'IOS31',  ver: 'v3608',    perms: 'priv', desc: 'Shopping channel IOS',                       exploitable: false },
  { slot: '35',  name: 'IOS35',  ver: 'v3608',    perms: 'priv', desc: 'System Menu 3.x',                            exploitable: true  },
  { slot: '36',  name: 'IOS36',  ver: 'v3608',    perms: 'priv', desc: 'Trucha/fakesign target — commonly patched',  exploitable: true  },
  { slot: '37',  name: 'IOS37',  ver: 'v5663',    perms: 'priv', desc: 'System Menu 4.x',                            exploitable: false },
  { slot: '53',  name: 'IOS53',  ver: 'v5662',    perms: 'priv', desc: 'Wii Fit channel',                            exploitable: false },
  { slot: '55',  name: 'IOS55',  ver: 'v5662',    perms: 'priv', desc: 'Photo channel 1.1',                          exploitable: false },
  { slot: '56',  name: 'IOS56',  ver: 'v5662',    perms: 'priv', desc: 'Shopping channel v2',                        exploitable: false },
  { slot: '57',  name: 'IOS57',  ver: 'v5919',    perms: 'priv', desc: 'EULA / update stub',                         exploitable: false },
  { slot: '58',  name: 'IOS58',  ver: 'v6176',    perms: 'priv', desc: 'USB 2.0 EHCI support',                       exploitable: false },
  { slot: '80',  name: 'IOS80',  ver: 'v6944',    perms: 'priv', desc: 'System Menu 4.3',                            exploitable: false },
  { slot: '254', name: 'IOS254', ver: '(BC)',      perms: 'priv', desc: 'GC backward compatibility layer',            exploitable: false },
  { slot: '255', name: 'IOS255', ver: '(MIOS)',    perms: 'priv', desc: 'GC mode IOS override',                       exploitable: false },
];

export const COMMANDS: CommandDef[] = [
  { cmd: 'help',                   desc: 'Show all available commands',             category: 'General'  },
  { cmd: 'clear',                  desc: 'Clear the terminal',                      category: 'General'  },
  { cmd: 'ctx <starlet|broadway>', desc: 'Switch CPU context',                      category: 'General'  },
  { cmd: 'regs',                   desc: 'Dump CPU registers for current context',  category: 'CPU'      },
  { cmd: 'setreg <r> <val>',       desc: 'Set a register to a hex value',           category: 'CPU'      },
  { cmd: 'setflag <N|Z|C|V> <0|1>',desc: 'Set ARM CPSR flag (Starlet only)',        category: 'CPU'      },
  { cmd: 'read <addr>',            desc: 'Read 32-bit word from address',           category: 'Memory'   },
  { cmd: 'write <addr> <val>',     desc: 'Write 32-bit word to address',            category: 'Memory'   },
  { cmd: 'dump <addr> <n>',        desc: 'Hex dump n bytes from address',           category: 'Memory'   },
  { cmd: 'memmap',                 desc: 'Print memory region map for current CPU', category: 'Memory'   },
  { cmd: 'probe <addr>',           desc: 'Check access rights for an address',      category: 'Memory'   },
  { cmd: 'ahbprot',                desc: 'Dump AHB protection register bits',       category: 'Hardware' },
  { cmd: 'srnprot',                desc: 'Read SRAM protection state',              category: 'Hardware' },
  { cmd: 'gpio read',              desc: 'Read all GPIO pin states',                category: 'Hardware' },
  { cmd: 'gpio set <pin> <0|1>',   desc: 'Toggle a GPIO output pin',               category: 'Hardware' },
  { cmd: 'ios',                    desc: 'List all IOS slot assignments',           category: 'IOS'      },
  { cmd: 'boot2',                  desc: 'Show boot chain info',                    category: 'IOS'      },
  { cmd: 'aes <key> <data>',       desc: 'Simulate AES-128 encryption',            category: 'Crypto'   },
  { cmd: 'sha1 <data>',            desc: 'Simulate SHA-1 hash',                    category: 'Crypto'   },
  { cmd: 'exploit trucha',         desc: 'Simulate Trucha bug signature check',     category: 'Exploits' },
  { cmd: 'exploit fakesign',       desc: 'Simulate fakesign / ticket forge test',   category: 'Exploits' },
  { cmd: 'exploit nandbin',        desc: 'Analyze NAND layout and metadata',        category: 'Exploits' },
  { cmd: 'exploit ahbprot',        desc: 'Simulate AHBPROT unlock sequence',        category: 'Exploits' },
  { cmd: 'reset soft',             desc: 'Simulate soft reset sequence',            category: 'General'  },
];

// ─── Initial register state ───────────────────────────────────────────────────

export function makeArmRegs() {
  return {
    r0: '0x00000000', r1: '0x0D400000', r2: '0x00000000', r3: '0x00000000',
    r4: '0x00000000', r5: '0x00000000', r6: '0x00000000', r7: '0x00000000',
    r8: '0x00000000', r9: '0x00000000', r10: '0x00000000', r11: '0x00000000',
    r12: '0x00000000', sp: '0x0D43FFF0', lr: '0x00000000', pc: '0x0D010000',
  } as Record<string, string>;
}

export function makePpcRegs() {
  const r: Record<string, string> = {};
  for (let i = 0; i < 32; i++) r[`r${i}`] = '0x00000000';
  r.pc  = '0xFFF00000';
  r.lr  = '0x00000000';
  r.ctr = '0x00000000';
  r.xer = '0x00000000';
  return r;
}

export function makeSimMem(): Record<string, string> {
  return {
    '0x0d800000': '0x0000FFFF',
    '0x0d800060': '0x00000000',
    '0x0d806000': '0x00000000',
    '0x0d806004': '0x00000000',
    '0x0d806008': '0x0000003C',
    '0x0d840000': '0x00000000',
    '0x0d880000': '0x00000000',
    '0x0d8c0000': '0x00000000',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseHex(s: string): number {
  try { return parseInt(s.replace(/^0x/i, ''), 16) || 0; } catch { return 0; }
}

export function toHex32(n: number): string {
  return '0x' + (n >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function lookupRegion(addr: string, ctx: CpuContext): MemRegion | undefined {
  const a = parseHex(addr);
  const list = ctx === 'starlet' ? MEM_ARM : MEM_PPC;
  return list.find(r => a >= parseHex(r.start) && a <= parseHex(r.end));
}

/** Very simple pseudo-hash for display — not cryptographically meaningful */
export function pseudoSHA1(data: string): string {
  let h = 0x67452301;
  for (let i = 0; i < data.length; i++) {
    h = (Math.imul(h, 31) + data.charCodeAt(i)) >>> 0;
  }
  const parts = [h, ~h >>> 0, (h ^ 0xDEADBEEF) >>> 0, (h * 0x9E3779B9) >>> 0, (h + 0x5A827999) >>> 0];
  return parts.map(p => p.toString(16).padStart(8, '0')).join('');
}

/** Very simple pseudo-encrypt for display — not real AES */
export function pseudoAES(key: string, data: string): string {
  const k = parseHex(key.slice(0, 8)) || 0xDEADC0DE;
  const d = parseHex(data.slice(0, 8)) || 0xCAFEBABE;
  const out = (d ^ k ^ 0x6363A5C6) >>> 0;
  return out.toString(16).padStart(8, '0').toUpperCase() + 'XXXXXXXXXXXXXXXXXXXXXXXX';
}
