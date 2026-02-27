# freekick

Jogo de pênalti em 2D com quiz para definir direção, altura e força do chute.

## Rodar localmente

```bash
cd /workspace/freekick
python3 -m http.server 4173 --directory /workspace/freekick
```

Abra `http://localhost:4173`.

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
