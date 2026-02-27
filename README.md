# freekick

Jogo de pênaltis 2D em estilo cartoon, com regras de gameplay mantidas e banco de perguntas importável.

## Como rodar rápido

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

Use o botão **Baixar template** para gerar um arquivo CSV de exemplo (abre no Excel/Planilhas).

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

Se o parsing não conseguir mapear corretamente, o jogo avisa e recomenda usar o template CSV.


- Upload/parsing roda sem dependências externas de CDN para evitar falhas de carregamento em ambientes bloqueados.

## Deploy no GitHub Pages (correção do item 1)

Este repositório agora inclui workflow automático em `.github/workflows/deploy-pages.yml`.

### Como ativar

1. No GitHub, abra **Settings → Pages**.
2. Em **Build and deployment**, selecione **Source: GitHub Actions**.
3. Garanta que o branch de desenvolvimento seja `main`.
4. Faça push de um commit no `main`.

Após o workflow `Deploy GitHub Pages` finalizar com sucesso, a URL publicada deve refletir a versão mais recente do jogo.

