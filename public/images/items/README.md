# Itens visuais do MU

Os arquivos publicados nesta pasta usam o padrão de ícones do OpenMU:
`item_grupo_indice_nivel.png`, por exemplo `item_0_31_0.png`. A API de
personagem devolve a chave `grupo_indice` e o caminho público em `visualPath`.

O pipeline `scripts/convert-mu-item-assets.mjs` permanece disponível para
clientes que não possuam os ícones do OpenMU. Para este site, os ícones
pré-renderizados do OpenMU são preferidos.
Ele reproduz o fluxo do MuTexConv open source, removendo o cabeçalho de 24 bytes
do OZJ e de 4 bytes do OZT antes de gerar o WebP:

- `Data/item_model.txt` para resolver grupo/índice/nome;
- `Data/Local/Eng/Item*.bmd` para os dados do item;
- `Data/Object*/**/*.bmd` para o modelo 3D;
- `Data/Object*/**/*.ozj` e `.ozt` para as texturas.

Uso local:

```powershell
$env:SHARP_MODULE = (Resolve-Path '.tmp-image-tools/node_modules/sharp').Path
node scripts/convert-mu-item-assets.mjs 'D:\IA\MU ONLINE\cliente instaler\CLIENTE NOVO\Data' public/images/items
```

Os ícones PNG são assets derivados já renderizados pelo OpenMU e não exigem
os binários proprietários do cliente no repositório.
