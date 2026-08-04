# Prompt para o Cowork — levantamento de referência do 2º tema

Cole o texto abaixo no Cowork. Troque a URL quando quiser analisar outro site.

---

## Prompt

Você vai navegar por um site e produzir uma **especificação de design e estrutura**
que será usada para construir um novo tema visual do nosso produto.

**URL:** https://justanotherpanel.com/

### Como trabalhar

Navegue pelo site de verdade (não deduza pelo print). Abra as páginas, role até o
fim, teste os estados interativos e inspecione o DOM/CSS computado quando precisar
de números exatos. Se algo exigir conta, registre até onde deu para ir e descreva o
que aparece na tela.

Produza uma **especificação para reimplementarmos do zero, no nosso código**.
Não copie arquivos CSS, imagens, ícones, logotipos, fontes proprietárias nem textos
de marketing palavra por palavra — o que interessa é a **estrutura, o padrão de
layout e as medidas** (grid, espaçamentos, escalas, hierarquia, comportamento).
Onde houver texto, descreva a *função* dele ("headline curta + subtítulo + 2 CTAs"),
não o conteúdo literal.

### 1. Sistema de design (o mais importante)

- **Cores:** valores hex de fundo, superfície/card, texto primário e secundário,
  borda, cor primária de marca, secundária, destaque, e os estados de sucesso /
  alerta / erro. Diga onde cada uma é usada. Se o site tiver modo escuro, capture
  as duas paletas.
- **Tipografia:** famílias usadas, e a escala real em px/rem para h1, h2, h3, corpo,
  legenda — com peso e altura de linha de cada uma.
- **Espaçamento e forma:** o passo de espaçamento (4px? 8px?), largura máxima do
  container, padding lateral no mobile e no desktop, raio de borda por tipo de
  elemento, e o padrão de sombra.
- **Movimento:** o que anima, com qual duração e curva.

### 2. Chrome (aparece em todas as páginas)

- **Header:** altura, o que tem à esquerda/centro/direita, se é fixo/sticky, se muda
  ao rolar, como abre o menu mobile, como ficam os estados hover/ativo, e o que muda
  quando o usuário está logado.
- **Rodapé:** quantidade de colunas, quais grupos de links existem, o que aparece na
  faixa inferior (legal, pagamento, selos), e como colapsa no mobile.
- **Elementos flutuantes:** chat, botão de topo, banners de cookie/promoção —
  posição, tamanho e quando aparecem.

### 3. Páginas

Para **cada** página abaixo, descreva a sequência de seções de cima para baixo. Para
cada seção diga: o propósito, o layout (quantas colunas, como quebra no mobile), os
componentes que a compõem e qualquer número relevante (tamanho de card, gap do grid).

- **Home**
- **Página de um serviço / produto** (abra pelo menos uma pelo catálogo)
- **Listagem de serviços / tabela de preços** — este site é um painel SMM como o
  nosso, então a tabela de serviços é a peça central: capture colunas, filtros,
  busca, paginação e como fica no mobile
- **Blog / artigos**, se houver: listagem, artigo interno, categoria
- **Páginas institucionais**: termos, privacidade, garantia/reembolso
- **Ajuda / FAQ / suporte / contato**
- **Login** e **criar conta**
- **Dashboard do cliente**, se der para ver sem pagar — mesmo que superficial

### 4. Componentes reutilizáveis

Catalogue os componentes que se repetem, com suas variantes e estados
(normal, hover, foco, desabilitado, carregando, erro):

botões · campos de formulário e mensagens de validação · cards · tabelas ·
abas · acordeão/FAQ · modais · badges e selos · avisos/alertas · paginação ·
breadcrumb · avaliações/depoimentos · blocos de preço

### 5. Fluxos

Descreva passo a passo, com o que muda na tela em cada etapa:

- comprar um serviço, do catálogo até o pagamento (vá o mais longe que conseguir
  sem pagar de verdade)
- criar conta e entrar
- buscar e filtrar serviços
- enviar um formulário de contato/suporte

### 6. Responsivo e acessibilidade

- Os pontos de quebra reais (redimensione a janela e anote onde o layout muda).
- Como header, tabelas, grids e rodapé se comportam em ~375px, ~768px e ~1440px.
- Uso de landmarks e headings, foco visível, e contraste das combinações principais.

### O que eu quero de volta

1. Um **resumo executivo** de 5 a 10 linhas: que tipo de identidade visual é essa e o
   que mais a define.
2. Os **tokens de design** da seção 1, prontos para virar variáveis CSS.
3. Um **mapa de páginas**: para cada página, a lista ordenada de seções.
4. O **catálogo de componentes** com variantes e estados.
5. **Capturas de tela** de cada página em desktop e mobile, e de cada estado
   interessante dos componentes.
6. Uma lista do que **não** conseguiu acessar e por quê.

### Como organizar a entrega

Nosso tema é montado a partir de cinco áreas. Agrupe as suas conclusões
diretamente nelas, para eu conseguir implementar sem retrabalho:

| Área | O que entra |
|---|---|
| `Home` | página inicial e todas as suas seções |
| `Service` | página de um serviço, incluindo a área de compra/cálculo |
| `Blog` | listagem, artigo e categoria |
| `SitePage` | termos, privacidade, garantia |
| `Help` | ajuda, FAQ e contato |
| `Chrome` | header, rodapé, elementos flutuantes |

Trate **login, criar conta e dashboard do cliente** como uma seção à parte,
marcada como "fora do tema por enquanto" — quero a documentação, mas essas telas
ainda não são temáveis no nosso sistema.
