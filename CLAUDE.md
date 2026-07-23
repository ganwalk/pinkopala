# CLAUDE.md

Guia para agentes de IA (Claude Code) trabalhando neste repositório.

## O que é este projeto

Site oficial da banda **Pink Opala** (indie pop, Goiânia-GO). É uma página única — `index.htm` — com todo o HTML, CSS e JavaScript inline. **Não há build, bundler, `package.json` nem testes automatizados.** O restante do repositório são imagens (capas de discos e fotos) servidas via `raw.githubusercontent.com`, que funciona como CDN.

O site carrega **apenas os arquivos `.webp`**. Cada `.webp` (lado maior ≤ 2000 px, qualidade 82) tem um original `.jpg`/`.jpeg`/`.JPG`/`.JPEG` de mesmo nome-base guardado no repo como fonte em alta resolução — **não referenciado pela página**. Ao adicionar/trocar uma foto: coloque o original, gere o `.webp` (script no README) e referencie **só o `.webp`** no HTML.

O idioma do site, dos comentários e dos commits é **português**. Mantenha assim.

## Como rodar

```bash
python3 -m http.server 8080
# abra http://localhost:8080/index.htm
```

Atenção: o Tailwind (via CDN `cdn.tailwindcss.com`) e o Lucide (via `unpkg.com`) precisam de acesso à internet. Em sandboxes sem acesso a esses CDNs a página renderiza sem utilitários do Tailwind — o layout quebra, mas o JS roda normalmente (útil para testar lógica).

## Arquitetura do `index.htm`

O arquivo tem três blocos, nesta ordem:

1. **`<style>` no `<head>`** — variáveis de tema (`--bg-color`, `--neon-pink`, etc., com `.light-mode` como override), estilos do hero sticky, tela de carregamento e regras críticas que **não podem depender do Tailwind** (ver abaixo).
2. **HTML** — nav fixa, hero (`#hero` com canvas de partículas), dashboard (`main.dash-container` com 4 colunas: história, discografia, galeria, contato) e 5 modais (`#modal-historia`, `#modal-image`, `#modal-gallery`, `#modal-discografia`, `#modal-contato`).
3. **`<script>` único** dentro de `DOMContentLoaded` — tema, partículas, scroll, modais, galeria, formulários e preloader. Funções usadas por `onclick` inline são expostas em `window` no fim do script (`window.openModal = openModal;` etc.). **Se criar uma função chamada por `onclick` no HTML, exponha-a lá.**

## Invariantes — não quebrar

- **Preloader bloqueia apenas nas fontes.** `startPreloader()` espera só `document.fonts.ready` (+ fallback de 4 s). Nunca volte a colocar imagens no caminho crítico de entrada — as fotos originais somam ~40 MB. Imagens são aquecidas em fila por `warmImagesInBackground()` via `requestIdleCallback`.
- **Empilhamento hero/dashboard no CSS inline.** `.dash-container` tem `position: relative; z-index: 10; background-color: var(--bg-color)` no `<style>` do documento, porque o hero é sticky (`z-index: 1`) e cobre a viewport inteira durante todo o scroll. Se isso migrar para classes do Tailwind, uma falha do CDN torna o site inclicável.
- **Fluxo de contato é `mailto:`, sem backend.** Os dois formulários (`form[data-contact-form]` na seção `#contacto` e no `#modal-contato`) usam `handleContactSubmit`, que monta `mailto:contato@pinkopala.com` com assunto e corpo a partir dos campos `nome`, `email` e `mensagem` (via `form.elements`). Alterou nomes de campos? Atualize o handler.
- **Partículas param quando não são necessárias.** O loop (`animateSand`) se auto-pausa quando as partículas assentam, quando o dashboard cobre o hero e quando a aba fica oculta; qualquer `mousemove`/`touchmove` reativa via `startSand()`. Não introduza animações que rodem incondicionalmente.
- **`prefers-reduced-motion`** é respeitado: partículas nascem no destino e o loop não inicia.
- **Galeria é lazy.** `initGallery()` (miniaturas do carrossel) roda na primeira chamada de `openGalleryModal()`, não no load. A lista de fotos é o array `galleryImages` no JS — para adicionar foto, inclua o arquivo no repo e a URL raw no array.
- **Fontes fazem parte da lógica.** As partículas do hero são amostradas do texto renderizado em "Archivo Black"; por isso o preloader espera as fontes. Trocar a fonte dos títulos afeta `initSandParticles()`.

## Convenções

- Tailwind por classes utilitárias no HTML; o que é temático usa CSS custom properties (`text-[var(--text-color)]`, etc.) para funcionar nos dois temas.
- JavaScript vanilla, sem dependências além de Lucide (ícones). Comentários em português explicando o *porquê*.
- URLs de imagem são absolutas para `raw.githubusercontent.com/ganwalk/pinkopala/main/...` (espaços como `%20`, `&` como `%26`, parênteses literais). Novos assets seguem o mesmo padrão e apontam para `.webp`.
- Nomes de arquivo de imagem têm espaços e parênteses — sempre cite os caminhos no shell.

## Como testar mudanças

Sem suíte de testes; valide no browser. Num sandbox, Playwright com o Chromium pré-instalado funciona bem:

- Carregamento: `#loading-screen` deve ser removido do DOM em poucos segundos.
- Contato: preencher os campos e submeter deve disparar navegação para `mailto:` (capturável via CDP `Page.frameRequestedNavigation`); submit vazio deve ser bloqueado pelo `required`.
- Galeria: `#gallery-thumbnails` deve estar vazio antes da primeira abertura do modal e com 11 filhos depois; setas do teclado trocam a imagem.
- Console sem erros de JS.
