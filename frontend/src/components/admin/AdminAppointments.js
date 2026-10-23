import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { STATUS } from '../chat/AppointmentCard';
import { formatDate, modalityLabel } from '../../utils/calendar';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminAppointments({ token }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetch(`${API}/api/admin/appointments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : [])).then(setItems).catch(() => setItems([]));
  }, [token]);

  const term = q.toLowerCase();
  const list = items.filter((a) => (status === 'all' || a.status === status) && (!term || `${a.proposer_name} ${a.invitee_name}`.toLowerCase().includes(term)));

  return (
    <div className="space-y-4" data-testid="admin-appointments-tab">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome" className="w-full rounded-xl border py-2 pl-10 pr-3" data-testid="admin-appointments-search" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border bg-white px-4 py-2" data-testid="admin-appointments-status-filter">
          <option value="all">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="p-4">Quem propôs</th><th className="p-4">Convidado</th><th className="p-4">Data</th><th className="p-4">Modalidade</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {list.map((a) => {
              const st = STATUS[a.status] || STATUS.pending;
              return (
                <tr key={a.id} className="hover:bg-gray-50" data-testid={`admin-appointment-row-${a.id}`}>
                  <td className="p-4 font-medium text-gray-800">{a.proposer_name}</td>
                  <td className="p-4 text-gray-700">{a.invitee_name}</td>
                  <td className="p-4 text-gray-700">{formatDate(a.date)} · {a.start_time}–{a.end_time}</td>
                  <td className="p-4 text-gray-700">{modalityLabel(a.modality)}</td>
                  <td className="p-4"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-12 text-center text-gray-500">Nenhum encontro encontrado</p>}
      </div>
    </div>
  );
}
