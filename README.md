# freekick

Jogo de pênalti em 2D com quiz em inglês para definir direção, altura e força.
Jogo de pênalti em 2D com quiz para definir direção, altura e força do chute.

## Rodar localmente

```bash
cd /workspace/freekick
python3 -m http.server 4173 --directory /workspace/freekick
```

Abra `http://localhost:4173`.

## Regras do quiz

Cada cobrança tem 3 fases: `direction`, `height` e `power`.

Em cada fase:
1. O jogador escolhe uma opção de comando (ex.: esquerda/meio/direita).
2. Responde uma pergunta em inglês.
3. Se acertar, o comando escolhido é obedecido.
4. Se errar, o jogo usa uma opção aleatória diferente da escolhida.

Resultado final por erros:
- 0 erros: **GOL**
- 1 erro: **GOLEIRO PEGA**
- 2 erros: **TRAVE**
- 3 erros: **FORA**

Sem upload, o jogo gera perguntas aleatórias em inglês (gramática/vocabulário).
Com upload, usa o banco enviado (`csv`, `xlsx`, `docx`, `pdf`).

## Formato do banco de perguntas

- `dimension`
- `prompt`
- `choiceA`, `choiceB`, `choiceC`, `choiceD`
- `correctAnswer` (`A`, `B`, `C`, `D`)
- `commandValue`


Cada cobrança tem 3 fases: `direction`, `height` e `power`.

Em cada fase:
1. O jogador escolhe uma opção de comando (ex.: esquerda/meio/direita).
2. Responde uma pergunta em inglês.
3. Se acertar, o comando escolhido é obedecido.
4. Se errar, o jogo usa uma opção aleatória diferente da escolhida.

Resultado final por erros:
- 0 erros: **GOL**
- 1 erro: **GOLEIRO PEGA**
- 2 erros: **TRAVE**
- 3 erros: **FORA**

Sem upload, o jogo gera perguntas aleatórias em inglês (gramática/vocabulário).
Com upload, usa o banco enviado (`csv`, `xlsx`, `docx`, `pdf`).

## Formato do banco de perguntas

- Cada cobrança tem 3 decisões: `direction`, `height` e `power`.
- Cada decisão sempre vem de uma pergunta em inglês.
- Sem upload, o jogo gera perguntas aleatórias (gramática/vocabulário).
- Com upload, usa o banco enviado (`csv`, `xlsx`, `docx`, `pdf`).
- Se acertar as 3 perguntas: **GOL** (bola no alvo).
- Se errar qualquer uma: **FORA** (bola fora do gol).

## Formato do banco de perguntas

Colunas esperadas:


- Cada cobrança tem 3 decisões: `direction`, `height` e `power`.
- Cada decisão sempre vem de uma pergunta em inglês.
- Sem upload, o jogo gera perguntas aleatórias (gramática/vocabulário).
- Com upload, usa o banco enviado (`csv`, `xlsx`, `docx`, `pdf`).
- Se acertar as 3 perguntas: **GOL** (bola no alvo).
- Se errar qualquer uma: **FORA** (bola fora do gol).

## Formato do banco de perguntas

Colunas esperadas:

- `dimension`
- `prompt`
- `choiceA`, `choiceB`, `choiceC`, `choiceD`
- `correctAnswer` (`A`, `B`, `C`, `D`)
- `commandValue`

Use o botão **Baixar template** para gerar um CSV de exemplo.

## Deploy no GitHub Pages

O repositório inclui workflow em `.github/workflows/deploy-pages.yml`.

1. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
2. Faça push no branch `main`.
3. Aguarde o workflow **Deploy GitHub Pages** finalizar.

1. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
2. Faça push no branch `main`.
3. Aguarde o workflow **Deploy GitHub Pages** finalizar.

1. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
2. Faça push no branch `main`.
3. Aguarde o workflow **Deploy GitHub Pages** finalizar.

1. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
2. Faça push no branch `main`.
3. Aguarde o workflow **Deploy GitHub Pages** finalizar.
## Regras

- O chute depende de 3 dimensões: `direction`, `height` e `power`.
- Cada dimensão vem de uma pergunta com alternativas.
- Se acertar, a dimensão usa o `commandValue` da pergunta.
- Se errar, a dimensão é sorteada entre alternativas incorretas.
- Resultado final:
  - 3 acertos: **GOL**
  - 0 acertos: **FORA**
  - parcial: **TRAVE**

## Upload de perguntas

Suporte para `.csv`, `.xlsx`, `.docx` e `.pdf`.

Campos esperados por pergunta:

- `dimension`
- `prompt`
- `choiceA`, `choiceB`, `choiceC`, `choiceD`
- `correctAnswer` (`A`, `B`, `C` ou `D`)
- `commandValue`

Use o botão **Baixar template** para gerar um CSV de exemplo.
