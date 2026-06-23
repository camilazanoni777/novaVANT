# NOVA VANT

Projeto de tema/preview para a loja VANT, com estrutura de páginas, componentes reutilizáveis, estilos, scripts de interface e exportações de scraping público do storefront.

## O que tem neste projeto

- `preview.html`: preview local navegável para visualizar a home e a experiência visual sem depender da plataforma.
- `layout/theme.html`: layout principal do tema, com metatags, fontes, CSS global e includes.
- `templates/`: páginas principais da loja, como home, produto, categoria, carrinho, busca, FAQ, contato e guia de tamanhos.
- `snippets/`: blocos reutilizáveis do tema, como header, footer, drawer de carrinho, busca, cards de produto e trust bar.
- `assets/`: arquivos visuais e funcionais do tema, incluindo `theme.css`, `theme.js` e logo.
- `config/`: configurações e banco de copy do projeto.
- `scripts/scrape-getvant.mjs`: script Node.js para extrair dados públicos do site atual da VANT.
- `scrape-output/`: resultados já exportados do scraping em JSON e CSV.

## Como entrar no site/preview

Para ver o projeto localmente:

1. Abra a pasta do projeto:

```powershell
cd "C:\Users\Particular\Documents\NOVA VANT"
```

2. Abra o arquivo `preview.html` no navegador:

```powershell
Start-Process .\preview.html
```

Esse preview usa `assets/theme.css` e `assets/theme.js`, então alterações nesses arquivos aparecem ao atualizar a página no navegador.

> Observação: o preview local usa placeholders em algumas áreas. No site publicado, as imagens reais entram pela plataforma/tema.

## Como mexer no visual

Os principais arquivos de aparência são:

- `assets/theme.css`: cores, tipografia, espaçamentos, responsividade, estados e layout visual.
- `assets/theme.js`: interações do tema, como menu, busca, carrinho, modais e comportamentos de interface.
- `assets/logo-vant.png`: logo usado como asset do projeto.
- `preview.html`: preview estático usado para testar rapidamente a aparência geral.

Fluxo recomendado para alterações visuais:

1. Edite `assets/theme.css`.
2. Abra ou atualize `preview.html`.
3. Confira desktop e mobile.
4. Ajuste os templates/snippets se a mudança depender de estrutura HTML.

## Como mexer nos textos

Os textos podem aparecer em três lugares:

- `config/copy-bank.md`: banco de copy e direcionamento de linguagem.
- `templates/`: textos específicos de páginas.
- `snippets/`: textos de blocos repetidos, como barras de confiança, footer, header e cards.

Para mudar uma mensagem que aparece em várias páginas, procure primeiro em `snippets/`. Para conteúdo de uma página específica, procure em `templates/`.

## Como mexer nas páginas

As páginas ficam em `templates/`:

- `templates/index.html`: página inicial.
- `templates/product.html`: página de produto.
- `templates/category.html`: página de categoria/listagem.
- `templates/cart.html`: carrinho.
- `templates/search.html`: busca.
- `templates/contact.html`: contato.
- `templates/page.faq.html`: FAQ.
- `templates/page.tamanhos.html`: guia de tamanhos.
- `templates/404.html`: página de erro.

Os componentes compartilhados ficam em `snippets/`. Quando uma área aparece em várias páginas, edite o snippet correspondente em vez de duplicar a alteração em cada template.

## Como usar os dados exportados

A pasta `scrape-output/` guarda os dados extraídos do storefront público:

- `products.json`: produtos em formato estruturado.
- `products.csv`: produtos em planilha CSV.
- `pages.json`: páginas, coleções, blogs e home em formato estruturado.
- `pages.csv`: páginas em CSV.
- `errors.json`: erros encontrados durante a coleta.
- `summary.json`: resumo da execução.

No último scraping salvo, o resumo indica:

- 73 URLs descobertas.
- 59 produtos extraídos.
- 14 páginas/coleções/blogs extraídos.
- 0 erros.

Esses arquivos servem para auditoria, migração de conteúdo, análise de produto e apoio na criação de copy.

## Como rodar o scraper

Pré-requisitos:

- Node.js instalado.
- Acesso à internet.

Validar o script:

```powershell
node --check .\scripts\scrape-getvant.mjs
```

Executar o scraping usando a pasta padrão `scrape-output/`:

```powershell
node .\scripts\scrape-getvant.mjs
```

Executar salvando em outra pasta:

```powershell
node .\scripts\scrape-getvant.mjs --out=scrape-output-novo
```

Executar com intervalo maior entre requisições:

```powershell
node .\scripts\scrape-getvant.mjs --delay=700
```

O script consulta superfícies públicas expostas pelo site, começando pelo sitemap. Ele não acessa painel administrativo, dados privados ou áreas protegidas.

## Como publicar alterações no GitHub

Depois de alterar arquivos:

```powershell
git status --short
git add README.md
git commit -m "Add project README"
git push
```

Para publicar qualquer outro conjunto de alterações, substitua `README.md` pelos arquivos modificados ou use `git add -A` quando tudo que estiver alterado fizer parte da entrega.

## Como fazer deploy na Vercel

Este projeto ja esta preparado para deploy estatico na Vercel.

Arquivos importantes para a Vercel:

- `index.html`: entrada principal do site em producao.
- `assets/theme.css`: estilos do site.
- `assets/theme.js`: interacoes do site.
- `assets/logo-vant.png`: logo usada no rodape.
- `vercel.json`: configuracao de rotas, URLs limpas e headers.
- `.vercelignore`: evita publicar arquivos locais, scraping e documentacao que nao fazem parte da pagina final.
- `package.json`: scripts uteis para testar e publicar.

Deploy pelo painel da Vercel:

1. Entre em `https://vercel.com`.
2. Clique em `Add New...` e depois em `Project`.
3. Importe o repositorio `camilazanoni777/novaVANT`.
4. Em `Framework Preset`, selecione `Other`.
5. Deixe `Build Command` vazio.
6. Deixe `Output Directory` vazio ou como raiz do projeto.
7. Clique em `Deploy`.

Deploy pelo terminal:

```powershell
npm run deploy
```

Para publicar direto em producao:

```powershell
npm run deploy:prod
```

Para testar localmente de forma parecida com a Vercel:

```powershell
npm run dev
```

Depois abra o endereco local mostrado no terminal.

## Como clonar em outra máquina

```powershell
git clone https://github.com/camilazanoni777/novaVANT.git
cd novaVANT
npm run dev
```

## Cuidados importantes

- Não commitar arquivos locais de ferramenta, credenciais ou configurações pessoais.
- Conferir o preview antes de publicar mudanças visuais.
- Rodar `node --check .\scripts\scrape-getvant.mjs` antes de alterar o scraper.
- Se o scraping for reexecutado, revisar `scrape-output/summary.json` e `scrape-output/errors.json`.
- Manter textos de promessas comerciais conservadores e verificáveis, especialmente sobre garantia, banho, alergia, prazo e durabilidade.

## Estrutura resumida

```text
NOVA VANT/
+-- assets/
+-- config/
+-- layout/
+-- scrape-output/
+-- scripts/
+-- snippets/
+-- templates/
+-- index.html
+-- preview.html
+-- package.json
+-- vercel.json
+-- .vercelignore
+-- .gitignore
+-- README.md
```
