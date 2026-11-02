import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Loader2 } from 'lucide-react';
import { AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import PixCheckout from '../components/billing/PixCheckout';

const API = process.env.REACT_APP_BACKEND_URL;
const BENEFITS = [
  'Chat ilimitado com clientes e profissionais',
  'Agendamentos pelo chat',
  'Envio de fotos, vídeos e localização',
  'Renovação simples todo mês via PIX',
];

export default function SubscriptionPage() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/subscription`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setInfo(await r.json());
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const until = info?.expires_at ? new Date(info.expires_at).toLocaleDateString('pt-BR') : null;

  return (
    <div className="feed-root min-h-screen pb-24" data-testid="subscription-page">
      <div className="mx-auto max-w-md px-4 pt-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-[#5C524B]" data-testid="subscription-back-button">
          <ArrowLeft size={16} /> Voltar
        </button>
        <section className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#A0703F]">
            <Crown size={14} /> Plano Mensal
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-[#2C221E]">
            R$ 19,90<span className="text-base font-medium text-[#8C827A]">/mês</span>
          </h1>
          <ul className="mt-4 space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-[#2C221E]"><Check size={16} className="mt-0.5 text-[#2A9D8F]" /> {b}</li>
            ))}
          </ul>
          <div className="mt-6">
            {!info ? (
              <Loader2 className="mx-auto animate-spin text-[#A0703F]" />
            ) : info.exempt ? (
              <p className="rounded-xl bg-[#E9F5F3] p-3 text-sm text-[#1F7A6F]" data-testid="subscription-exempt">Conta de administrador: acesso liberado.</p>
            ) : (
              <>
                {info.active && (
                  <p className="mb-3 rounded-xl bg-[#E9F5F3] p-3 text-sm text-[#1F7A6F]" data-testid="subscription-active">
                    Assinatura ativa até <strong>{until}</strong>. Você pode renovar antecipadamente; os dias são somados.
                  </p>
                )}
                <PixCheckout
                  createPath="/api/subscription/pix"
                  amount={19.9}
                  label={info.active ? 'Renovar por mais 30 dias (R$ 19,90)' : 'Assinar com PIX (R$ 19,90)'}
                  onPaid={load}
                />
              </>
            )}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
