# Modelo Word do contrato — como evitar erros

O arquivo `contrato.docx` usa **papel timbrado** feito com formas flutuantes no corpo do texto. Isso funciona ao abrir no Word, mas ao **preencher variáveis** (`{nome_cliente}`, `{produtos_lista}`, etc.) o texto cresce e o Word recalcula páginas — surgem página em branco, logo deslocada e, se o sistema alterar o XML das formas, o arquivo pode **não abrir**.

## O que fazer no Word (recomendado)

### 1. Papel timbrado no **cabeçalho**, não no corpo

1. Abra o modelo no Word.
2. **Inserir → Cabeçalho → Cabeçalho em branco** (ou editar o existente).
3. Coloque no cabeçalho:
   - retângulo azul de fundo;
   - moldura arredondada + logo clara (marca d’água);
   - logo ZAVO do topo, se quiser em todas as páginas.
4. Em cada forma: **Clique direito → Posicionar → Mais opções de layout**:
   - **Em relação à página** (não “ao parágrafo”);
   - **Atrás do texto** para fundo; **Na frente do texto** só se for logo que deve sobrepor.
5. No **corpo** do documento deixe **apenas texto** e placeholders `{...}` — sem repetir moldura A4 em cada “página”.

### 2. Logo do rodapé no **rodapé** do Word

1. **Inserir → Rodapé**.
2. Insira a logo pequena alinhada à direita ou ao centro.
3. Assim ela aparece em **todas as páginas** sem âncora gigante no último parágrafo.

### 3. Assinaturas em texto simples

- Use tabela de 2 colunas (VENDEDORA | COMPRADOR) ou linhas `___________` em parágrafos normais.
- Evite agrupar assinatura + logo + moldura no mesmo parágrafo com desenhos ancorados a milhares de pixels abaixo.

### 4. Variáveis docxtemplater

| Placeholder | Uso |
|-------------|-----|
| `{produtos_lista}` | Lista de produtos (várias linhas com `•`) |
| `{nome_cliente}`, `{cpf}`, etc. | Dados do cliente |
| `{valor_total}` | Só número (`5.000,00`) — o modelo já tem `R$` antes |
| `{numero_contrato}` | Número do contrato |

Salve como `contrato.docx` em `api/_lib/templates/` (ou regenere com `node scripts/prepare-docx-templates.mjs` se usar o modelo em `src/assets/modelos`).

### 5. O que **não** fazer

- Não duplicar moldura de página inteira várias vezes no meio do texto (o Word grava `lastRenderedPageBreak` e quebra páginas).
- Não ancorar logo do rodapé com “em relação ao parágrafo” + distância enorme (ex.: 3 000 000 EMU).
- Não misturar lista automática do Word vazia logo após `{produtos_lista}`.

## O que o sistema faz hoje

Após preencher o modelo, o servidor só:

- remove `lastRenderedPageBreak` (quebras fantasma);
- remove parágrafos de lista vazios após produtos.

**Não** altera mais formas/molduras (isso corrompia o `.docx`).

Se ainda houver página em branco, o ajuste definitivo é **simplificar o modelo** conforme os itens 1–3 acima.
