# freekick

Jogo de pênalti em 2D com quiz em inglês para definir direção, altura e força.

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

Use o botão **Baixar template** para gerar um CSV de exemplo.
