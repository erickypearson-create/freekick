# freekick

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
