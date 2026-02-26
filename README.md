# freekick

Jogo de pênaltis 2D em estilo cartoon, com regras de gameplay mantidas.

## Como rodar rápido
Jogo de cobrança de pênaltis em 2D com estilo visual de transmissão (estádio, placar e câmera atrás do cobrador), usando perguntas em inglês como placeholders.

## Como abrir no navegador

### Opção 1 (rápida)
Abra o arquivo `index.html` diretamente no navegador.

### Opção 2 (recomendada)
Execute um servidor local:

```bash
cd /workspace/freekick
python3 -m http.server 4173 --directory /workspace/freekick
```

Abra `http://localhost:4173`.

## Regras mantidas

- Fluxo com 4 decisões: direção, altura, força e efeito.
- Cada decisão depende de pergunta em inglês (placeholder).
- Acertos aumentam a precisão do chute.
- Efeitos mantidos: 3 dedos, cavadinha e dancinha.
- Física mantida: corrida, trajetória curva da bola e reação do goleiro.

## Visual

- Cena cartoon reconstruída do zero (campo em perspectiva, gol com profundidade, rede, goleiro e cobrador orgânicos).
- Placas atrás do gol com branding Wizard by Pearson alinhadas.
- Background estático é gerado uma única vez e reutilizado a cada frame.


## Ajustes visuais recentes

- Removidos elementos de placar/contagem no rodapé (bolinhas, labels e blocos de bandeira).
- Bola redesenhada com padrão clássico de futebol (base branca + gomos escuros) e sombra elíptica.
- Goleiro trocado para sprite dedicado em `assets/keeper-wizkid.svg`.
- Background permanece único e pré-renderizado uma única vez via `buildStaticBackground()`.
Depois acesse `http://localhost:4173`.

## Mecânicas

- Escolhas do chute por 4 etapas: **direção**, **altura**, **força** e **efeito**.
- Cada etapa depende de uma pergunta em inglês (placeholder para você substituir depois).
- Acertos aumentam bônus de precisão e reduzem erro aleatório no chute.
- Efeitos especiais implementados:
  - **3 dedos** (curva);
  - **cavadinha** (trajetória mais alta e suave);
  - **dancinha** (run-up para tentar deslocar o goleiro).
- Placar no topo atualiza a disputa após cada cobrança.

- Placas atrás do gol com identidade visual inspirada no logo da Wizard (desenho vetorial em canvas).

## Física e animações aplicadas

- Jogador com corrida até a bola (run-up) e movimento corporal (inclinação, pernas e braços).
- Bola com trajetória mais fluida usando curva de Bézier + efeito lateral + queda gravitacional no final.
- Goleiro com movimento leve antes da cobrança (balanço lateral tradicional).
- Defesa com reação física:
  - salto para esquerda/direita com alcance em altura **baixa**, **média** e **alta**;
  - salto vertical para bolas altas no centro;
  - agachada para bolas rasteiras no centro.
