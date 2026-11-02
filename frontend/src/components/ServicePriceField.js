import React, { useContext, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function ServicePriceField() {
  const { user, token, login } = useContext(AuthContext);
  const [price, setPrice] = useState(user?.service_price ?? '');
  const [saving, setSaving] = useState(false);

  if (!['volunteer', 'helper'].includes(user?.role)) return null;

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_price: Number(String(price).replace(',', '.')) || 0 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Erro ao salvar');
      login(token, d);
      toast.success('Preço salvo');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-6" data-testid="service-price-section">
      <h3 className="font-bold text-textPrimary mb-1">Preço do seu serviço</h3>
      <p className="mb-3 text-sm text-textSecondary">Cobrado do cliente via PIX quando você aceitar um agendamento. Deixe 0 para atender sem cobrar. Taxa do app: 10%.</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-textSecondary">R$</span>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0,00" className="pl-9" data-testid="service-price-input" />
        </div>
        <Button onClick={save} disabled={saving} className="rounded-full" data-testid="service-price-save-button">{saving ? 'Salvando…' : 'Salvar'}</Button>
      </div>
    </div>
  );
}
