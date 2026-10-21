'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MU_CLASSES } from '@/lib/mu-constants';

type CharData = {
  name: string;
  class: number;
  level: number;
  resets: number;
  grandResets: number;
  guild: string | null;
  hidden: boolean;
  attributes?: { strength: number; agility: number; vitality: number; energy: number; command: number };
  map?: number;
  online?: boolean;
  equipment?: { slot: number; slotName: string; name: string; category: string; durability: number }[];
};

type State =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ok'; data: CharData };

export default function CharacterPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name ?? '');
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    fetch(`/api/character/${encodeURIComponent(name)}`)
      .then(async (res) => {
        if (!active) return;
        if (res.status === 404) return setState({ status: 'notfound' });
        const json = await res.json();
        if (!res.ok || !json.success) return setState({ status: 'error' });
        setState({ status: 'ok', data: json.data });
      })
      .catch(() => active && setState({ status: 'error' }));

    return () => {
      active = false;
    };
  }, [name]);

  if (state.status === 'loading') {
    return <Shell><p className="text-slate-400">Carregando personagem...</p></Shell>;
  }

  if (state.status === 'notfound') {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Personagem não encontrado</h1>
        <p className="text-slate-400 mt-2">Nenhum personagem com o nome &ldquo;{name}&rdquo;.</p>
        <Link href="/rankings" className="inline-block mt-6 text-amber-400 hover:underline">Voltar aos rankings</Link>
      </Shell>
    );
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <p className="text-slate-400">Não foi possível carregar este personagem agora.</p>
      </Shell>
    );
  }

  const c = state.data;
  const className = MU_CLASSES[c.class]?.name ?? `Classe #${c.class}`;

  return (
    <Shell>
      <header className="rounded-xl border border-white/10 bg-[#0d1017] p-6">
        <p className="text-xs uppercase tracking-widest text-amber-400">Perfil do personagem</p>
        <h1 className="text-3xl font-bold text-white mt-1">{c.name}</h1>
        <p className="text-slate-400 mt-1">
          {className}{c.guild ? ` · Guilda ${c.guild}` : ''}
        </p>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Stat label="Nível" value={c.level} />
          <Stat label="Resets" value={c.resets} />
          <Stat label="Grand Resets" value={c.grandResets} />
          <Stat label="Status" value={c.hidden ? 'Oculto' : c.online ? 'Online' : 'Offline'} />
        </dl>
      </header>

      {c.hidden ? (
        <section className="mt-6 rounded-xl border border-white/10 bg-[#0d1017] p-6 text-slate-400">
          Este personagem está em modo invisível. Atributos, mapa e equipamentos não são exibidos.
        </section>
      ) : (
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0d1017] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Atributos</h2>
            <dl className="grid grid-cols-2 gap-3">
              <Stat label="Força" value={c.attributes?.strength ?? '-'} />
              <Stat label="Agilidade" value={c.attributes?.agility ?? '-'} />
              <Stat label="Vitalidade" value={c.attributes?.vitality ?? '-'} />
              <Stat label="Energia" value={c.attributes?.energy ?? '-'} />
              <Stat label="Comando" value={c.attributes?.command ?? '-'} />
            </dl>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0d1017] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Localização</h2>
            <p className="text-slate-300">
              {c.map !== undefined ? `Mapa ${c.map}` : 'Indisponível'}
            </p>
          </div>
        </section>
      )}

      {!c.hidden && (
        <section
          className="relative mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#0d1017] p-6"
          style={{
            backgroundImage: "linear-gradient(rgba(13,16,23,.88), rgba(13,16,23,.94)), url('/images/mu-inventory-box.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-4">Equipamentos</h2>
            {c.equipment && c.equipment.length > 0 ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {c.equipment.map((item) => (
                  <li key={item.slot} className="rounded-lg border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
                    <p className="text-xs text-slate-400">{item.slotName}</p>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.category} · Durabilidade {item.durability}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">Nenhum equipamento visível.</p>
            )}
          </div>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="min-h-screen bg-[#07090d] bg-cover bg-fixed bg-center px-4 py-10 text-slate-100"
      style={{ backgroundImage: "linear-gradient(rgba(7,9,13,.86), rgba(7,9,13,.96)), url('/images/mu_season6_classes_1791666426349.jpg')" }}
    >
      <div className="mx-auto max-w-4xl">{children}</div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}
