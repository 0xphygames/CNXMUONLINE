// Decodificador somente leitura de Character.Inventory (equipamentos).
// Registros de 16 bytes. Campos validados contra itens reais:
//   byte 0  = índice do item dentro do grupo
//   byte 2  = durabilidade atual
//   byte 9  = grupo (parte alta do nibble)
// Slots de equipamento validados: ver EQUIPMENT_SLOTS. Os demais não são exibidos.

import catalog from './item-catalog.json';

const RECORD_SIZE = 16;
const EMPTY = 0xff;

export const EQUIPMENT_SLOTS: Record<number, string> = {
  0: 'Mão direita',
  1: 'Mão esquerda',
  2: 'Capacete',
  3: 'Armadura',
  4: 'Calça',
  5: 'Luvas',
  6: 'Botas',
  8: 'Pet',
  10: 'Colar',
};

const GROUP_CATEGORY: Record<number, string> = {
  5: 'Cajado',
  6: 'Escudo',
  7: 'Capacete',
  8: 'Armadura',
  9: 'Calça',
  10: 'Luvas',
  11: 'Botas',
};

type CatalogEntry = { g: number; i: number; s: number; n: string };
const index = new Map<string, CatalogEntry>();
for (const entry of catalog as CatalogEntry[]) {
  index.set(`${entry.g}:${entry.i}`, entry);
}

export type EquippedItem = {
  slot: number;
  slotName: string;
  group: number;
  index: number;
  name: string;
  category: string;
  durability: number;
  visualKey: string;
  visualPath: string;
  level: number;
  skill: boolean;
  luck: boolean;
  optionLevel: number;
  options: string[];
};

const EXCELLENT_OPTIONS = [
  'Dano excelente',
  'Taxa de dano excelente',
  'Defesa excelente',
  'Reflete dano',
  'Aumenta mana máxima',
  'Aumenta vida máxima',
];

/**
 * Assets publicados seguem a chave do cliente MU: grupo + índice do item.
 * O arquivo é gerado a partir dos BMD/OZJ/OZT do cliente e fica em
 * public/images/items. Quando ainda não existe, o frontend mantém o fallback
 * textual sem quebrar a página pública.
 */
export function getItemVisual(group: number, itemIndex: number) {
  const visualKey = `${group}_${itemIndex}`;
  return {
    visualKey,
    // OpenMU publica o ícone base no formato item_grupo_indice_nivel.png.
    // Usamos nível 0 para não confundir o visual com o level do item equipado.
    visualPath: `/images/items/item_${group}_${itemIndex}_0.png`,
  };
}

export function decodeEquipment(inventory: Uint8Array): EquippedItem[] {
  const result: EquippedItem[] = [];

  for (const slot of Object.keys(EQUIPMENT_SLOTS).map(Number)) {
    const start = slot * RECORD_SIZE;
    if (start + RECORD_SIZE > inventory.length) continue;

    const record = inventory.subarray(start, start + RECORD_SIZE);
    if (record[0] === EMPTY) continue;

    const group = record[9] >> 4;
    const itemIndex = record[0];
    const entry = index.get(`${group}:${itemIndex}`);
    const visual = getItemVisual(group, itemIndex);
    const level = (record[1] >> 3) & 0x0f;
    const optionLevel = record[1] & 0x03;
    const skill = (record[1] & 0x80) !== 0;
    const luck = (record[1] & 0x04) !== 0;
    const options = EXCELLENT_OPTIONS.filter((_, bit) => (record[3] & (1 << bit)) !== 0);

    result.push({
      slot,
      slotName: EQUIPMENT_SLOTS[slot],
      group,
      index: itemIndex,
      name: entry?.n ?? 'Item desconhecido',
      category: GROUP_CATEGORY[group] ?? (entry?.s === 8 ? 'Pet' : entry?.s === 10 ? 'Colar/Anel' : 'Outro'),
      durability: record[2],
      ...visual,
      level,
      skill,
      luck,
      optionLevel,
      options,
    });
  }

  return result;
}
