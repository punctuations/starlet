'use client';

import { SimState } from './useSimulator';

interface RegistersProps {
  state: SimState;
}

export default function Registers({ state }: RegistersProps) {
  const { ctx, armRegs, ppcRegs, armFlags, armCPSR } = state;

  if (ctx === 'starlet') {
    const entries = Object.entries(armRegs);
    const flagEntries = Object.entries(armFlags) as [string, number][];

    return (
      <div className="p-4 space-y-4 h-full overflow-y-auto">
        <div>
          <p className="text-xs font-mono mb-2" style={{ color: '#6b7280' }}>
            STARLET — ARM926EJ-S REGISTERS
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {entries.map(([name, val]) => (
              <div key={name} className="flex justify-between font-mono text-xs py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
                <span style={{ color: '#6b7280' }}>{name.toUpperCase().padEnd(4)}</span>
                <span style={{ color: '#34d399' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-mono mb-2" style={{ color: '#6b7280' }}>CPSR</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="flex justify-between py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
              <span style={{ color: '#6b7280' }}>Mode</span>
              <span style={{ color: '#c084fc' }}>{armCPSR.mode}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
              <span style={{ color: '#6b7280' }}>T-bit</span>
              <span style={{ color: armCPSR.T ? '#22c55e' : '#374151' }}>{armCPSR.T}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
              <span style={{ color: '#6b7280' }}>F (FIQ)</span>
              <span style={{ color: armCPSR.F ? '#ef4444' : '#374151' }}>{armCPSR.F}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
              <span style={{ color: '#6b7280' }}>I (IRQ)</span>
              <span style={{ color: armCPSR.I ? '#ef4444' : '#374151' }}>{armCPSR.I}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-mono mb-2" style={{ color: '#6b7280' }}>FLAGS</p>
          <div className="flex gap-3">
            {flagEntries.map(([f, v]) => (
              <div
                key={f}
                className="flex flex-col items-center px-3 py-2 rounded border font-mono text-xs"
                style={{
                  borderColor: v ? '#22c55e' : '#1f2937',
                  background: v ? '#052e1a' : '#0f1117',
                  color: v ? '#22c55e' : '#374151',
                }}
              >
                <span className="text-base font-bold">{f}</span>
                <span className="text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Broadway PPC
  const gpr = Array.from({ length: 32 }, (_, i) => [`r${i}`, ppcRegs[`r${i}`] || '0x00000000'] as [string, string]);
  const special = [['pc', ppcRegs.pc], ['lr', ppcRegs.lr], ['ctr', ppcRegs.ctr], ['xer', ppcRegs.xer]] as [string, string][];

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: '#6b7280' }}>
          BROADWAY — PowerPC 750CL GPR
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {gpr.map(([name, val]) => (
            <div key={name} className="flex justify-between font-mono text-xs py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
              <span style={{ color: '#6b7280' }}>{name.toUpperCase().padEnd(4)}</span>
              <span style={{ color: '#60a5fa' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: '#6b7280' }}>SPECIAL REGISTERS</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {special.map(([name, val]) => (
            <div key={name} className="flex justify-between font-mono text-xs py-0.5 border-b" style={{ borderColor: '#1f2937' }}>
              <span style={{ color: '#6b7280' }}>{name.toUpperCase().padEnd(4)}</span>
              <span style={{ color: '#c084fc' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
