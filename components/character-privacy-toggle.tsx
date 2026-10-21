'use client';

import React, { useEffect, useState } from 'react';

type PrivacyState = { invisible: boolean; isVip: boolean };

// Switch de perfil público/oculto para o personagem selecionado.
// Visível somente para conta VIP. A API valida sessão, posse e VIP em cada chamada.
export default function CharacterPrivacyToggle({ name }: { name: string }) {
  const [state, setState] = useState<PrivacyState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState(null);
    setError(null);

    fetch(`/api/character/${encodeURIComponent(name)}/privacy`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!active || !res.ok || !json.success) return;
        setState({ invisible: json.data.invisible, isVip: json.data.isVip });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [name]);

  // Não VIP ou sem sessão: não mostra o controle.
  if (!state || !state.isVip) return null;

  const toggle = async () => {
    const next = !state.invisible;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/character/${encodeURIComponent(name)}/privacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invisible: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || 'Não foi possível alterar a privacidade.');
        return;
      }
      setState({ ...state, invisible: next });
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded border border-[#1a1f29] bg-[#0b0d11] p-3 text-xs">
      <div>
        <span className="block text-[10px] text-slate-400">Perfil público</span>
        <strong className="text-slate-100">
          {state.invisible ? 'Oculto: dados e equipamentos não aparecem' : 'Visível para todos'}
        </strong>
        {error && <span className="mt-1 block text-red-400">{error}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!state.invisible}
        disabled={saving}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          state.invisible ? 'bg-slate-600' : 'bg-amber-500'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            state.invisible ? 'translate-x-0.5' : 'translate-x-5'
          }`}
        />
      </button>
    </div>
  );
}
