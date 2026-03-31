'use client';

import { MEM_ARM, MEM_PPC, HW_REGS, MemRegion } from '../lib/simulator';
import { CpuContext } from '../lib/simulator';

interface MemoryMapProps {
  ctx: CpuContext;
  mem: Record<string, string>;
}

const RW_COLOR: Record<string, string> = {
  R:  '#ef4444',
  W:  '#f59e0b',
  RW: '#22c55e',
};

function RegionTable({ regions, title }: { regions: MemRegion[]; title: string }) {
  return (
    <div className="mb-6">
      <p className="font-mono text-xs mb-2" style={{ color: '#6b7280' }}>{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Start</th>
              <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>End</th>
              <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Size</th>
              <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Acc</th>
              <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Name</th>
              <th className="text-left py-1"       style={{ color: '#374151' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r, i) => (
              <tr key={i} className="border-b" style={{ borderColor: '#111827' }}>
                <td className="py-1 pr-4" style={{ color: '#c084fc' }}>{r.start}</td>
                <td className="py-1 pr-4" style={{ color: '#c084fc' }}>{r.end}</td>
                <td className="py-1 pr-4" style={{ color: '#6b7280' }}>{r.size}</td>
                <td className="py-1 pr-4" style={{ color: RW_COLOR[r.rw] }}>{r.rw}</td>
                <td className="py-1 pr-4" style={{ color: '#34d399' }}>{r.name}</td>
                <td className="py-1"       style={{ color: '#6b7280' }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MemoryMap({ ctx, mem }: MemoryMapProps) {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <RegionTable
        title={ctx === 'starlet' ? 'STARLET (ARM926EJ-S) PHYSICAL MEMORY' : 'BROADWAY (PPC 750CL) PHYSICAL MEMORY'}
        regions={ctx === 'starlet' ? MEM_ARM : MEM_PPC}
      />

      <div>
        <p className="font-mono text-xs mb-2" style={{ color: '#6b7280' }}>HOLLYWOOD HARDWARE REGISTERS (LIVE)</p>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                <th className="text-left py-1 pr-6" style={{ color: '#374151' }}>Address</th>
                <th className="text-left py-1 pr-6" style={{ color: '#374151' }}>Name</th>
                <th className="text-left py-1 pr-6" style={{ color: '#374151' }}>Value</th>
                <th className="text-left py-1"       style={{ color: '#374151' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {HW_REGS.map((r, i) => {
                const val = mem[r.addr.toLowerCase()] || '—';
                return (
                  <tr key={i} className="border-b" style={{ borderColor: '#111827' }}>
                    <td className="py-1 pr-6" style={{ color: '#c084fc' }}>{r.addr}</td>
                    <td className="py-1 pr-6" style={{ color: '#f59e0b' }}>{r.name}</td>
                    <td className="py-1 pr-6" style={{ color: val !== '—' ? '#34d399' : '#374151' }}>{val}</td>
                    <td className="py-1"       style={{ color: '#6b7280' }}>{r.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
