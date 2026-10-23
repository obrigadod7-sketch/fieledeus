import React from 'react';
import { Building2, Ban, CheckCircle, MapPin, Phone, Globe } from 'lucide-react';

export default function AdminAssociations({ users, onToggleBlock }) {
  const list = users.filter((u) => u.role === 'association');
  return (
    <div className="space-y-3" data-testid="admin-associations-tab">
      {list.length === 0 && (
        <div className="rounded-2xl border bg-white py-12 text-center text-gray-500"><Building2 className="mx-auto mb-2 text-primary" />Nenhuma associação cadastrada ainda.</div>
      )}
      {list.map((a) => (
        <div key={a.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center" data-testid={`admin-association-${a.id}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-800">{a.organization || a.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{a.blocked ? 'Bloqueada' : 'Ativa'}</span>
            </div>
            <p className="text-sm text-gray-600">{a.responsible_name ? `${a.responsible_name} · ` : ''}{a.email}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
              {(a.location?.address || a.city) && <span className="flex items-center gap-1"><MapPin size={12} />{a.location?.address || a.city}</span>}
              {a.phone && <span className="flex items-center gap-1"><Phone size={12} />{a.phone}</span>}
              {a.website && <span className="flex items-center gap-1"><Globe size={12} />{a.website}</span>}
              {a.registration_number && <span>Registro: {a.registration_number}</span>}
            </div>
            {a.bio && <p className="mt-2 text-sm text-gray-600">{a.bio}</p>}
          </div>
          <button onClick={() => onToggleBlock(a)} className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold ${a.blocked ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-rose-300 text-rose-700 hover:bg-rose-50'}`} data-testid={`admin-association-block-${a.id}`}>
            {a.blocked ? <><CheckCircle size={16} /> Reativar</> : <><Ban size={16} /> Bloquear</>}
          </button>
        </div>
      ))}
    </div>
  );
}
