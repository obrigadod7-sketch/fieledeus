import React, { useContext, useEffect, useRef, useState } from 'react';
import { Loader2, Copy, CheckCircle2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../../App';
import { Button } from '../ui/button';

const API = process.env.REACT_APP_BACKEND_URL;
const brl = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

export default function PixCheckout({ createPath, amount, label, onPaid }) {
  const { token } = useContext(AuthContext);
  const [pix, setPix] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const finish = () => {
    clearInterval(timer.current);
    setPaid(true);
    toast.success('Pagamento confirmado!');
    onPaid?.();
  };

  const poll = (id) => {
    timer.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/payments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok && d.status === 'approved') finish();
        if (r.ok && ['rejected', 'cancelled'].includes(d.status)) {
          clearInterval(timer.current);
          toast.error('Pagamento não concluído. Gere um novo PIX.');
          setPix(null);
        }
      } catch { /* tenta de novo no próximo ciclo */ }
    }, 5000);
  };

  const generate = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}${createPath}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Erro ao gerar PIX');
      if (d.status === 'approved') return finish();
      setPix(d);
      poll(d.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(pix.qr_code);
    toast.success('Código PIX copiado');
  };

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center" data-testid="pix-paid">
        <CheckCircle2 size={44} className="text-[#2A9D8F]" />
        <p className="font-semibold text-[#2C221E]">Pagamento confirmado</p>
      </div>
    );
  }

  if (!pix) {
    return (
      <Button onClick={generate} disabled={busy} className="w-full rounded-full bg-[#2A9D8F] py-6 text-base hover:bg-[#238578]" data-testid="pix-generate-button">
        {busy ? <Loader2 size={18} className="mr-2 animate-spin" /> : <QrCode size={18} className="mr-2" />}
        {label || `Pagar ${brl(amount)} com PIX`}
      </Button>
    );
  }

  return (
    <div className="space-y-3 text-center" data-testid="pix-checkout">
      <p className="text-sm text-[#5C524B]">Escaneie o QR Code no app do seu banco ou use o PIX copia e cola.</p>
      {pix.qr_code_base64 && (
        <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code PIX" className="mx-auto w-56 rounded-xl border border-[#E8E2D9]" data-testid="pix-qr-image" />
      )}
      <p className="text-lg font-bold text-[#2C221E]" data-testid="pix-amount">{brl(pix.amount)}</p>
      <Button variant="outline" onClick={copy} className="w-full rounded-full" data-testid="pix-copy-button">
        <Copy size={16} className="mr-2" /> Copiar código PIX
      </Button>
      <p className="flex items-center justify-center gap-2 text-xs text-[#8C827A]" data-testid="pix-waiting">
        <Loader2 size={14} className="animate-spin" /> Aguardando pagamento… a confirmação é automática.
      </p>
    </div>
  );
}
