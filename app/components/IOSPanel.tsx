'use client';

import { IOS_MODS, COMMANDS } from '../lib/simulator';

export default function IOSPanel() {
  const categories = [...new Set(COMMANDS.map(c => c.category))];

  return (
    <div className="p-4 h-full overflow-y-auto space-y-6">
      {/* IOS Slot Map */}
      <div>
        <p className="font-mono text-xs mb-2" style={{ color: '#6b7280' }}>IOS SLOT MAP — INSTALLED MODULES</p>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Slot</th>
                <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Name</th>
                <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Version</th>
                <th className="text-left py-1 pr-4" style={{ color: '#374151' }}>Flags</th>
                <th className="text-left py-1"       style={{ color: '#374151' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {IOS_MODS.map((m, i) => (
                <tr key={i} className="border-b" style={{ borderColor: '#111827' }}>
                  <td className="py-1 pr-4" style={{ color: '#6b7280' }}>{m.slot}</td>
                  <td className="py-1 pr-4" style={{ color: '#34d399' }}>{m.name}</td>
                  <td className="py-1 pr-4" style={{ color: '#c084fc' }}>{m.ver}</td>
                  <td className="py-1 pr-4">
                    {m.exploitable ? (
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#2d1a00', color: '#f59e0b', border: '1px solid #854d0e' }}>
                        ⚠ vuln
                      </span>
                    ) : (
                      <span style={{ color: '#374151' }}>—</span>
                    )}
                  </td>
                  <td className="py-1" style={{ color: '#6b7280' }}>{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-xs mt-2" style={{ color: '#f59e0b' }}>
          ⚠ IOS36 is the classic target for Trucha / fakesign exploits.
        </p>
      </div>

      {/* Command Reference */}
      <div>
        <p className="font-mono text-xs mb-2" style={{ color: '#6b7280' }}>COMMAND REFERENCE</p>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat}>
              <p className="font-mono text-xs mb-1" style={{ color: '#60a5fa' }}>{cat}</p>
              <div className="space-y-0.5 ml-2">
                {COMMANDS.filter(c => c.category === cat).map((c, i) => (
                  <div key={i} className="flex gap-4 font-mono text-xs">
                    <span className="shrink-0" style={{ color: '#34d399', minWidth: '220px' }}>{c.cmd}</span>
                    <span style={{ color: '#6b7280' }}>{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
