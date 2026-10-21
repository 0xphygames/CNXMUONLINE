# Itens visuais do MU

Os arquivos publicados nesta pasta usam a chave `grupo_indice.webp`, por
exemplo `0_31.webp`. A API de personagem devolve essa mesma chave em
`visualKey` e o caminho público em `visualPath`.

O pipeline de conversão deve usar os arquivos originais do cliente:

- `Data/Local/Eng/Item*.bmd` para resolver o modelo;
- `Data/Object*/**/*.bmd` para o modelo 3D;
- `Data/Object*/**/*.ozj` e `.ozt` para as texturas.

Não coloque os binários proprietários do cliente no repositório. Publique
somente os renders 2D `.webp` aprovados para exibição no site.
