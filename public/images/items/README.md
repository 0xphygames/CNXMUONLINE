# Itens visuais do MU

Os arquivos publicados nesta pasta usam a chave `grupo_indice.webp`, por
exemplo `0_31.webp`. A API de personagem devolve essa mesma chave em
`visualKey` e o caminho público em `visualPath`.

O pipeline `scripts/convert-mu-item-assets.mjs` usa os arquivos originais do cliente.
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

O script gera a textura WebP correspondente à chave do item. Para renderizar
o modelo 3D completo do BMD como ícone, é necessário executar o renderizador
Three.js/Electron do cliente com câmera ortográfica e exportar o frame. Não
coloque os binários proprietários do cliente no repositório. Publique
somente os renders 2D `.webp` aprovados para exibição no site.
