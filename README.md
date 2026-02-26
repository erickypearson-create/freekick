# freekick

Jogo de pênaltis 2D em estilo cartoon, com regras de gameplay mantidas e banco de perguntas importável.

## Como rodar rápido
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

## Regras de gameplay (acerto/erro por dimensão)

Dimensões ativas atualmente:
- `direction` (left/center/right)
- `height` (low/mid/high)
- `power` (weak/medium/strong)

Para cada dimensão:
- Se acertar a pergunta: o chute obedece o `commandValue` da dimensão.
- Se errar: o valor da dimensão vira aleatório entre as alternativas (nunca o valor correto).

Resultado final:
- Todas dimensões corretas: **GOL**
- Todas dimensões erradas: **FORA**
- Misto (parte certa, parte errada): **TRAVE**

## Upload de perguntas (PDF / DOCX / XLSX)

Na lateral direita da tela:
1. Selecione um arquivo (`.pdf`, `.docx`, `.xlsx`).
2. Escolha o modo: `Ordem` ou `Aleatório`.
3. Clique em **Carregar arquivo**.

O banco é salvo localmente (`localStorage`) e vira a fonte das perguntas no jogo.

### Formato recomendado (XLSX)

Primeira aba com colunas:
- `dimension`
- `prompt`
- `choiceA`, `choiceB`, `choiceC`, `choiceD`
- `correctAnswer` (`A|B|C|D`)
- `commandValue`

Use o botão **Baixar template** para gerar um arquivo de exemplo.

### Padrão de parsing para DOCX/PDF

Texto em blocos separados por linha em branco, com chaves:

```txt
dimension: direction
prompt: Which side should the striker shoot?
choiceA: Left
choiceB: Center
choiceC: Right
choiceD: Far right
correctAnswer: A
commandValue: left
```

Se o parsing não conseguir mapear corretamente, o jogo avisa e recomenda usar o template XLSX.
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
