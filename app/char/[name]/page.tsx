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
  equipment?: {
    slot: number;
    slotName: string;
    group: number;
    index: number;
    name: string;
    category: string;
    durability: number;
    visualKey: string;
    visualPath: string;
  }[];
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
              <>
                <div className="mx-auto w-full max-w-[375px] rounded-lg border border-white/10 bg-black/50 p-2 shadow-2xl">
                  <div className="relative aspect-[375/425] overflow-hidden rounded-md bg-black">
                    <img
                      src="/images/mu-equipment-layout.png"
                      alt="Layout original dos equipamentos do personagem"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {c.equipment.map((item) => (
                      <EquipmentMarker key={item.slot} item={item} />
                    ))}
                  </div>
                </div>
                <ul className="mx-auto mt-4 grid max-w-2xl gap-3 md:grid-cols-2">
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
              </>
            ) : (
              <p className="text-slate-400">Nenhum equipamento visível.</p>
            )}
          </div>
        </section>
      )}
    </Shell>
  );
}

const EQUIPMENT_MARKERS: Record<number, { left: string; top: string; width: string; height: string }> = {
  0: { left: '8%', top: '29%', width: '26%', height: '30%' },
  1: { left: '66%', top: '29%', width: '26%', height: '30%' },
  2: { left: '39%', top: '19%', width: '22%', height: '17%' },
  3: { left: '39%', top: '39%', width: '22%', height: '23%' },
  4: { left: '39%', top: '60%', width: '22%', height: '23%' },
  5: { left: '8%', top: '59%', width: '26%', height: '24%' },
  6: { left: '66%', top: '59%', width: '26%', height: '24%' },
  8: { left: '66%', top: '8%', width: '26%', height: '22%' },
  10: { left: '8%', top: '45%', width: '22%', height: '16%' },
};

function EquipmentMarker({ item }: { item: NonNullable<CharData['equipment']>[number] }) {
  const [active, setActive] = useState(false);
  const marker = EQUIPMENT_MARKERS[item.slot] ?? { left: '38%', top: '80%', width: '24%', height: '18%' };
  return (
    <button
      type="button"
      title={`${item.slotName}: ${item.name} · Durabilidade ${item.durability}`}
      aria-label={`${item.slotName}: ${item.name}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="group absolute z-10 flex cursor-help items-center justify-center overflow-visible rounded-md border border-transparent transition hover:border-amber-300/80 hover:bg-amber-200/10 focus:border-amber-300 focus:bg-amber-200/10 focus:outline-none"
      style={{ left: marker.left, top: marker.top, width: marker.width, height: marker.height }}
    >
      <img
        src={item.visualPath}
        alt={item.name}
        className="h-full w-full object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,.9)]"
        onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
      />
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[min(15rem,70vw)] -translate-x-1/2 rounded-lg border border-amber-300/50 bg-[#120f0a]/95 px-3 py-2 text-left text-xs text-white shadow-xl shadow-black/70 transition ${active ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-1 opacity-0'}`}
      >
        <strong className="block text-amber-200">{item.name}</strong>
        <span className="block text-slate-300">{item.slotName} · {item.category}</span>
        <span className="block text-slate-300">Durabilidade: {item.durability}</span>
        <span className="block text-[10px] text-slate-500">Grupo {item.group} · Índice {item.index}</span>
      </span>
    </button>
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
