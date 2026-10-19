'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { WebShopProductRow } from '@/lib/db';

const currencies: Record<string, string> = { C: 'WCoin C', P: 'WCoin P', G: 'Goblin Point' };
const visualByCategory: Record<string, { icon: string; tone: string; details: string[] }> = {
  pet: { icon: '🐼', tone: 'from-emerald-950 to-slate-900', details: ['Mascote do CashShop', 'Entrega no baú virtual'] },
  equipment: { icon: '⚔️', tone: 'from-red-950 to-slate-900', details: ['Equipamento do jogo', 'Índices reais do CashShop'] },
  accessory: { icon: '💍', tone: 'from-violet-950 to-slate-900', details: ['Acessório especial', 'Pronto para uso no jogo'] },
  consumables: { icon: '💎', tone: 'from-blue-950 to-slate-900', details: ['Item consumível', 'Uso imediato após retirar'] },
};

export default function ShopPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [products, setProducts] = useState<WebShopProductRow[]>([]);
  const [category, setCategory] = useState('all');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [chest, setChest] = useState<any[]>([]);

  const load = async () => {
    const res = await fetch('/api/shop/products', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setProducts(data.products);
    if (user) {
      const chestRes = await fetch('/api/shop/chest', { cache: 'no-store' });
      const chestData = await chestRes.json();
      if (chestData.success) setChest(chestData.items);
    }
  };
  useEffect(() => { load(); }, [user]);

  const categories = useMemo(() => Array.from(new Map(products.map(p => [p.CategorySlug, p.CategoryName])).entries()), [products]);
  const visible = category === 'all' ? products : products.filter(p => p.CategorySlug === category);
  const balance = (currency: string) => currency === 'C' ? user?.shopPoints.WCoinC : currency === 'P' ? user?.shopPoints.WCoinP : user?.shopPoints.GoblinPoint;

  async function buy(product: WebShopProductRow) {
    if (!user) { setMessage('Entre na sua conta para comprar.'); return; }
    setBusy(product.ProductID); setMessage('');
    try {
      const quantity = quantities[product.ProductID] || 1;
      const res = await fetch('/api/shop/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.ProductID, quantity }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Não foi possível concluir a compra.');
      setMessage(`Compra concluída! Pedido #${data.orderId}. O item foi enviado ao baú virtual.`);
      await refreshUser(); await load();
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(null); }
  }

  if (authLoading) return <main className="max-w-7xl mx-auto px-6 py-20 text-slate-300">Carregando loja...</main>;
  return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#18130b] to-[#11151d] p-8">
      <p className="text-xs uppercase tracking-[.25em] text-amber-400">CashShop oficial</p>
      <h1 className="mt-2 text-4xl font-black text-white">Itens do jogo no seu site</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">Compre com o saldo real da conta. A entrega é feita automaticamente no baú virtual do CashShop.</p>
      {user ? <div className="mt-5 flex flex-wrap gap-3 text-sm">{[['C','WCoin C',user.shopPoints.WCoinC],['P','WCoin P',user.shopPoints.WCoinP],['G','Goblin Point',user.shopPoints.GoblinPoint]].map(([key,label,value]) => <span key={key as string} className="rounded-full border border-[#343a48] bg-[#0c0f14] px-4 py-2 text-white"><b className="text-amber-400">{label as string}:</b> {Number(value).toLocaleString()}</span>)}</div> : <Link href="/login" className="mt-5 inline-block text-amber-400 underline">Entre para comprar</Link>}
    </header>
    {message && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{message}</div>}
    <div className="flex flex-wrap gap-2"><button onClick={() => setCategory('all')} className={`rounded-lg px-4 py-2 text-sm ${category === 'all' ? 'bg-amber-400 text-black' : 'bg-[#151922] text-slate-300'}`}>Todos</button>{categories.map(([slug,name]) => <button key={slug} onClick={() => setCategory(slug)} className={`rounded-lg px-4 py-2 text-sm ${category === slug ? 'bg-amber-400 text-black' : 'bg-[#151922] text-slate-300'}`}>{name}</button>)}</div>
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map(product => { const qty = quantities[product.ProductID] || 1; const total = product.Price * qty; const enough = (balance(product.Currency) ?? 0) >= total; const visual = visualByCategory[product.CategorySlug] || visualByCategory.consumables; return <article key={product.ProductID} className="overflow-hidden rounded-xl border border-[#292f3c] bg-[#12151c]"><div className={`flex h-36 items-center justify-center bg-gradient-to-br ${visual.tone}`}><span className="text-7xl drop-shadow-lg" role="img" aria-label={product.Name}>{visual.icon}</span></div><div className="p-5"><div className="flex items-start justify-between"><span className="rounded bg-amber-400/10 px-2 py-1 text-[10px] uppercase text-amber-300">{product.CategoryName}</span><Package className="h-5 w-5 text-amber-400" /></div><h2 className="mt-4 min-h-12 text-lg font-bold text-white">{product.Name}</h2><p className="mt-1 text-xs text-slate-400">{product.Description || visual.details[0]}</p><div className="mt-3 flex flex-wrap gap-1.5">{visual.details.map(detail => <span key={detail} className="rounded-full border border-[#343a48] px-2 py-1 text-[10px] text-slate-300">{detail}</span>)}</div><div className="mt-5 flex items-center justify-between"><strong className="text-2xl text-amber-300">{total.toLocaleString()}</strong><span className="text-xs text-slate-400">{currencies[product.Currency]}</span></div><div className="mt-4 flex gap-2"><input aria-label={`Quantidade de ${product.Name}`} type="number" min={1} max={100} value={qty} onChange={e => setQuantities({ ...quantities, [product.ProductID]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} className="w-20 rounded-lg border border-[#343a48] bg-[#0b0d11] px-3 py-2 text-white"/><button disabled={busy === product.ProductID || (!!user && !enough)} onClick={() => buy(product)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{busy === product.ProductID ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} {user && !enough ? 'Saldo insuficiente' : 'Comprar'}</button></div></div></article> })}</section>
    {user && <section className="rounded-2xl border border-[#292f3c] bg-[#12151c] p-6"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Package className="h-5 w-5 text-amber-400"/>Baú virtual</h2><p className="mt-1 text-sm text-slate-400">Itens comprados pelo site e disponíveis na conta {user.username}.</p>{chest.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{chest.map(item => <div key={item.DeliveryID} className="rounded-lg border border-[#343a48] p-4"><b className="text-white">{item.Name}</b><p className="mt-1 text-xs text-slate-400">Entrega #{item.DeliveryID} · {new Date(item.DeliveredAt).toLocaleString('pt-BR')}</p></div>)}</div> : <p className="mt-5 text-sm text-slate-500">Seu baú ainda está vazio.</p>}</section>}
  </main>;
}

