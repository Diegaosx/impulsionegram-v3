# Temas do site público

O site público é renderizado por um **tema**. O tema escolhido fica em
`Configurações Gerais → Tema`, no painel admin, e é salvo em
`GeneralSettings.theme`.

## O que um tema controla (e o que não controla)

Um tema controla **só a apresentação**: marcação, layout, classes e tokens de
cor/tipografia.

Um tema **nunca** busca dados, não fala com a API e não implementa regra de
negócio. Checkout, PIX, criação de pedido, blog, SEO, analytics, reCAPTCHA e as
integrações ficam fora dos temas — assim um tema novo não consegue quebrar nem
duplicar nada disso, e continua recebendo tudo o que o dashboard controla.

Fora do escopo dos temas: painel admin, área do cliente (`/minha-conta`,
`/perfil`, `/pedido/:id`) e as telas de login/cadastro.

## Slots

Cada rota pública corresponde a um slot (veja `types.ts`):

| Slot       | Rotas                                                        |
|------------|--------------------------------------------------------------|
| `Home`     | `/`                                                          |
| `Service`  | `/servico/:slug`                                             |
| `Blog`     | `/blog`, `/blog/artigo/:slug`, `/blog/categoria/:categoria`  |
| `SitePage` | `/privacidade`, `/termos`, `/garantia`                       |
| `Help`     | `/ajuda`                                                     |

Cada slot recebe, já pronto para renderizar: conteúdo do dashboard
(`services`, `plans`, `homeContent`), dados da empresa (`company`) e a marca
(`siteName`, `logoUrl`).

## Como criar um tema novo

1. Crie `src/themes/<id>/` com um `theme.ts` que chama `registerTheme()`:

   ```ts
   import { registerTheme } from '../registry';
   import './theme.css';

   export default registerTheme({
     id: 'meu-tema',
     label: 'Meu Tema',
     description: 'Aparece embaixo do seletor no admin.',
     slots: { Home, Service, Blog, SitePage, Help }
   });
   ```

2. Em `theme.css`, defina os tokens no escopo do tema. O prefixo `html[...]` é
   proposital: garante que a sobrescrita vença independente da ordem dos
   stylesheets.

   ```css
   html[data-theme='meu-tema'] {
     --color-primary: #0d9488;
     --color-secondary: #f97316;
     --color-accent: #22d3ee;
   }
   ```

3. Adicione **uma linha** em `src/themes/index.ts`:

   ```ts
   import './meu-tema/theme';
   ```

4. Adicione o id em `KNOWN_THEME_IDS`, em `db.ts` (o servidor não consegue
   importar o registry do cliente, então mantém um espelho simples).

Pronto. Nenhuma rota e nenhum arquivo em `App.tsx` precisa mudar, e o tema
aparece sozinho no seletor do admin via `listThemes()`.

## Ids desconhecidos

`resolveThemeId()` devolve `'default'` para qualquer id que não esteja
registrado neste build, e `getGeneralSettings()` faz a mesma coerção no
servidor. Remover um tema do código não derruba o site de quem já o tinha
selecionado.

## Onde ficam as coisas no tema padrão

- `views/` — composição de cada página (um arquivo por slot)
- `chrome/` — Header, Footer, FloatingWidgets, CookieConsent
- `sections/` — blocos de página (Hero, ServicesGrid, calculadora, blog, …)

> Nota: hoje algumas seções ainda carregam lógica junto da marcação (a
> calculadora/checkout e o blog são os casos maiores). A extração dessa lógica
> para hooks compartilhados em `src/site/` é o próximo passo, e é o que vai
> permitir que um segundo tema reescreva 100% da marcação reaproveitando todo o
> fluxo de pagamento e de blog.
