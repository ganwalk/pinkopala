# Pink Opala — Site Oficial

Site oficial da banda **Pink Opala**, desenvolvido como uma única página (`index.htm`) com foco em performance, identidade visual e experiência imersiva.

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Demo](#demo)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Como Executar Localmente](#como-executar-localmente)
- [Decisões Técnicas](#decisões-técnicas)
- [Acessibilidade e Performance](#acessibilidade-e-performance)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Sobre a Banda](#sobre-a-banda)

---

## Sobre o Projeto

Este repositório contém o site oficial da Pink Opala — duo de indie pop de Goiânia (GO), Brasil. A página foi construída como um arquivo HTML único, sem frameworks de UI ou bundlers, priorizando leveza, controle total sobre animações e facilidade de hospedagem.

## Demo

> O site é hospedado diretamente via GitHub Pages a partir da branch `main`.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Tela de carregamento** | Preloader enxuto que espera apenas as fontes (essenciais para o hero); o título preenche de rosa e o site abre em segundos — as imagens aquecem em segundo plano |
| **Efeito de partículas** | Canvas interativo com física de mola — as partículas formam o nome da banda e reagem ao rato/toque |
| **Transição hero → dashboard** | Slide suave ao clicar no título; usa altura real em px para evitar salto no mobile |
| **Tema claro / escuro** | Alternância via variáveis CSS (`--bg-color`, `--text-color` etc.), persistindo em toda a UI |
| **Discografia** | Lista completa com capas clicáveis e links de download em MP3 e WAV via Google Drive |
| **Galeria** | Grid de pré-visualização + modal carrossel com miniaturas, navegação por teclado e toque |
| **Modais** | História, Discografia completa, Galeria e Contato — acessíveis pela navegação ou botões inline |
| **Formulário de contato** | Nome, e-mail e mensagem; ao enviar, abre o cliente de e-mail do visitante com um `mailto:` já redigido (assunto e corpo montados a partir dos campos) |
| **Links e apoio** | Streaming (YouTube, Spotify, Bandcamp, Apple Music, Tidal, Deezer), redes sociais e chave PIX com botão de cópia |
| **Navegação superior** | Aparece ao rolar para o dashboard; logo e links abrem os respectivos modais no desktop |

---

## Tecnologias

| Camada | Ferramenta |
|---|---|
| Markup | HTML5 |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) via CDN + CSS custom properties |
| Scripts | JavaScript vanilla (ES2020+) |
| Ícones | [Lucide](https://lucide.dev/) via CDN |
| Fontes | Google Fonts — *Archivo Black* (títulos) e *Space Grotesk* (corpo) |
| Animações | Canvas 2D API + `requestAnimationFrame` |
| Hospedagem | GitHub Pages |

Sem dependências de build, sem `node_modules`, sem bundler.

---

## Estrutura do Repositório

```
pinkopala/
├── index.htm                         # Página única — todo o HTML, CSS e JS
│
├── circle.jpg                        # Foto circular (seção História)
│
├── Capa - *.{jpg,jpeg,JPG,JPEG}     # Capas dos lançamentos (6 arquivos)
│
├── Foto por Gabriel Arruda *.jpg    # Fotos de Gabriel Arruda (3 arquivos)
├── Foto por Geovana Moura *.jpg     # Fotos de Geovana Moura (2 arquivos)
├── _Foto por Geovana Moura *.jpg    # Fotos de Geovana Moura — série 2 (5 arquivos)
│
└── README.md
```

As imagens são referenciadas via URL raw do GitHub (`raw.githubusercontent.com`), então o repositório funciona como CDN próprio.

---

## Como Executar Localmente

Não há etapa de build. Basta servir o diretório com qualquer servidor HTTP estático:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Extensão "Live Server" → botão "Go Live"
```

Depois abra `http://localhost:8080` no navegador.

> Abrir `index.htm` diretamente como `file://` também funciona, mas algumas fontes e ícones podem não carregar por restrições CORS do browser.

---

## Decisões Técnicas

### Preloader que só bloqueia no essencial

A tela de carregamento espera **apenas** `document.fonts.ready` — as fontes são o único recurso indispensável para o primeiro paint, pois as partículas do hero são desenhadas a partir do texto renderizado. Todas as imagens (capas, galeria, história) são aquecidas depois, uma a uma, via `requestIdleCallback`, sem competir com carregamentos disparados pelo usuário. Um fallback de 4 segundos garante que ninguém fica preso na tela de carregamento.

Antes, o preloader baixava todas as fotos em resolução original (~40 MB) antes de liberar o site; agora a entrada depende de ~100 KB de fontes.

### Contato via `mailto:` redigido

Os formulários de contato (seção e modal) montam um link `mailto:contato@pinkopala.com` com assunto (`Contato pelo site — {nome}`) e corpo (nome, e-mail e mensagem) codificados com `encodeURIComponent`, e navegam para ele — abrindo o cliente de e-mail do visitante com tudo preenchido. Não há backend: o envio é sempre feito pelo próprio e-mail do usuário. Os campos nome e mensagem usam validação `required` nativa do browser.

### Galeria com inicialização sob demanda

As 11 miniaturas do carrossel só são criadas (e baixadas) na primeira abertura do modal da galeria, não no carregamento da página.

### Empilhamento crítico independente do CDN

O `z-index`/`position` que faz o dashboard pintar acima do hero sticky fica no CSS inline do documento — não nas classes do Tailwind — para que a página continue clicável mesmo se o CDN do Tailwind falhar ou demorar.

### Loop de partículas sob demanda

O canvas de areia roda `requestAnimationFrame` **somente quando necessário**:

- Para automaticamente quando todas as partículas assentam (velocidade < 0.01 px/frame por 30 frames consecutivos).
- Pausa quando o dashboard cobre o hero (detectado via `getBoundingClientRect`).
- Pausa quando a aba vai para segundo plano (`visibilitychange`).
- Reativa a cada evento de `mousemove` ou `touchmove`.

Isso evita que a física das partículas consuma CPU/GPU enquanto o usuário lê o restante do site.

### Array de partículas coloridas reutilizado

O array `colored` é declarado uma vez fora do loop de animação e tem `.length = 0` a cada frame, em vez de `const colored = []`. Isso elimina a pressão sobre o garbage collector em displays de alta taxa de atualização (120 Hz+).

### Transição hero → dashboard sem salto no mobile

A transição usa `offsetHeight` (altura real em pixels) em vez de `100vh`. No mobile, `100vh` inclui a barra de endereços do browser, criando uma discrepância com `offsetHeight` que causava um salto visual ao final da animação.

### `will-change` cirúrgico

`will-change: transform` é aplicado ao dashboard apenas durante o slide e removido imediatamente depois, evitando que o browser mantenha uma camada de composição desnecessária permanentemente.

---

## Acessibilidade e Performance

- **`prefers-reduced-motion`**: quando ativo, as partículas nascem já na posição final (sem dispersão) e o loop de física não é iniciado; todas as transições CSS são encurtadas para `0.001ms`.
- **Canvas em camada de GPU**: `transform: translateZ(0)` promove o canvas a uma camada própria de composição, separando o rasterizado das partículas do restante do layout.
- **Imagens com `loading="lazy"` e `decoding="async"`**: imagens fora do viewport carregam sob demanda e decodificam fora da thread principal.
- **Conexões com `preconnect`**: `fonts.googleapis.com`, `fonts.gstatic.com` e `raw.githubusercontent.com` são resolvidos antes do parser chegar aos recursos.
- **Fallback do preloader**: se a conexão for muito lenta, o site se torna acessível após 4 segundos independentemente do progresso de carga.
- **Clipboard API com fallback**: o botão "Copiar PIX" usa `navigator.clipboard.writeText` e recua para `document.execCommand('copy')` em browsers antigos.

---

## Contribuição

Este é um site pessoal de banda. Pull requests de terceiros não são esperados, mas issues com relatos de bugs ou sugestões de melhoria são bem-vindos.

Para propor uma alteração:

1. Fork o repositório
2. Crie uma branch descritiva (`fix/salto-mobile`, `feat/swipe-galeria`, etc.)
3. Faça o commit das mudanças
4. Abra um Pull Request descrevendo o problema e a solução

---

## Licença

O **código-fonte** deste site está disponível sob a licença [MIT](https://opensource.org/licenses/MIT).

As **fotografias**, **artes de capa** e demais **ativos visuais** são de propriedade de Pink Opala e de seus respectivos autores (Gabriel Arruda, Geovana Moura). Todos os direitos reservados — não redistribuir sem autorização.

---

## Sobre a Banda

**Pink Opala** é um duo de indie pop formado por **Nataly Martins** (voz, letras e sintetizadores) e **João Victor Santana Campos** (guitarra e programações), com origem em Goiânia (GO), Brasil.

Ativos desde 2018, lançaram trabalhos que alcançaram rádios em Portugal, coletâneas no Reino Unido e ouvintes em mais de 100 países. Seu primeiro álbum, *Sempre Nunca* (2024), contou com colaborações com Boogarins e Ynaiã Benthroldo e ganhou versão em Libras.

- [Instagram](https://www.instagram.com/pinkopala/)
- [Spotify](https://open.spotify.com/intl-pt/artist/73KiHAF1Xe5cP6H3pZsGXy)
- [YouTube](https://www.youtube.com/@PinkOpala)
- [Bandcamp](https://pinkopala.bandcamp.com/)
