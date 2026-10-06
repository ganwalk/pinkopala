// Grava o Reel de demonstração do site (9:16, 1080×1920, sem áudio).
//
// Uso (na raiz do repositório):
//   python3 -m http.server 8080 &
//   NODE_PATH="$(npm root -g)" node demo/gravar-reel.cjs
//
// Requer Playwright (npm i -g playwright) e ffmpeg no PATH. O resultado sai em
// demo/saida/pinkopala-reel.mp4 (H.264, 30 fps, sem trilha de áudio — a música
// entra pelo próprio Instagram).
//
// Como funciona: o palco (demo/palco.html) é uma página 540×960 renderizada com
// deviceScaleFactor 2. O site real roda num iframe 360×640 (layout mobile de
// verdade) e o script interage com ele como um usuário — movendo o "dedo",
// tocando, rolando e digitando — enquanto o CDP captura cada quadro pintado.
// Os quadros são remontados pelo ffmpeg respeitando os tempos reais.

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const SITE = process.env.SITE_PATH || '/index.htm';
const SAIDA = path.join(__dirname, 'saida');
const QUADROS = path.join(SAIDA, 'quadros');
const FPS = 30;

// --- Textos do vídeo: edite aqui -------------------------------------------
const TEXTOS = {
    abertura:    { kicker: 'Case · pinkopala.com', titulo: 'Fiz o site da Pink Opala', corpo: 'Banda indie pop de Goiânia. Bora ver as soluções por trás dele?' },
    carregamento:{ kicker: '01 · Performance', titulo: 'Abre em segundos', corpo: 'A entrada espera só as <b>fontes (~100 KB)</b>. As fotos carregam depois, em segundo plano.' },
    particulas:  { kicker: '02 · Interação', titulo: 'O nome vira areia', corpo: 'Milhares de partículas com <b>física de mola</b> em Canvas reagem ao toque. Zero bibliotecas.' },
    transicao:   { kicker: '03 · Navegação', titulo: 'Um toque e desliza', corpo: 'O conteúdo sobe por cima do hero numa transição suave, <b>sem salto no celular</b>.' },
    historia:    { kicker: '04 · Conteúdo', titulo: 'Tudo numa página', corpo: 'História, discografia, galeria e contato. Detalhes abrem em <b>janelas leves</b>.' },
    discografia: { kicker: '05 · Discografia', titulo: 'Capas e downloads', corpo: 'Toque na capa para ampliar. Cada lançamento tem <b>MP3 e WAV</b> para baixar.' },
    galeria:     { kicker: '06 · Imagens', titulo: '57 MB → 4,5 MB', corpo: 'Fotos convertidas para <b>WebP (−92%)</b> sem perda visível. A galeria só carrega quando é aberta.' },
    tema:        { kicker: '07 · Identidade', titulo: 'Claro ou escuro', corpo: 'Um toque troca o tema do site inteiro — até as partículas mudam de cor.' },
    contato:     { kicker: '08 · Contato', titulo: 'E-mail já redigido', corpo: 'O formulário monta a mensagem pronta no app de e-mail do visitante. <b>Sem servidor, sem spam.</b>' },
    pix:         { kicker: '09 · Apoio', titulo: 'PIX em um toque', corpo: 'Links de streaming, redes e a chave PIX copiada direto para o fã apoiar.' },
    wordpress:   { kicker: '10 · Onde roda', titulo: 'HTML puro ou WordPress', corpo: 'Um arquivo único, sem build. E uma versão pronta para <b>Elementor</b>, isolada do tema.' },
    final: {
        kicker: 'Design + código sob medida',
        titulo: 'Quer um site assim?',
        corpo: 'Para sua banda, artista, coletivo, evento ou instituição.',
        cta: 'Me chama na DM',
        url: 'VEJA AO VIVO · PINKOPALA.COM',
    },
};
// ---------------------------------------------------------------------------

const espera = (ms) => new Promise(r => setTimeout(r, ms));
const suave = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

(async () => {
    fs.rmSync(QUADROS, { recursive: true, force: true });
    fs.mkdirSync(QUADROS, { recursive: true });

    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    page.on('pageerror', e => console.error('[erro na página]', e.message));

    await page.goto(`${BASE}/demo/palco.html`);
    await page.evaluate(() => document.fonts.ready);

    // --- Captura de quadros via CDP (cada quadro carrega o próprio timestamp) ---
    const cdp = await context.newCDPSession(page);
    const quadros = [];
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
        const arq = path.join(QUADROS, `q${String(quadros.length).padStart(5, '0')}.jpg`);
        fs.writeFileSync(arq, Buffer.from(data, 'base64'));
        quadros.push({ arq, t: metadata.timestamp });
        cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });

    const palco = (fn, arg) => page.evaluate(([fn, arg]) => window.palco[fn](arg), [fn, arg]);
    const legenda = (t) => palco('legenda', t);

    // --- "Dedo": move o indicador visual e o mouse real juntos ---
    let pos = { x: 270, y: 640 };
    async function mover(x, y, ms = 500, visivel = true) {
        const passos = Math.max(1, Math.round(ms / 16));
        const de = { ...pos };
        for (let i = 1; i <= passos; i++) {
            const k = suave(i / passos);
            pos = { x: de.x + (x - de.x) * k, y: de.y + (y - de.y) * k };
            await page.mouse.move(pos.x, pos.y);
            await page.evaluate(([x, y, v]) => window.palco.dedo(x, y, { visivel: v }), [pos.x, pos.y, visivel]);
            await espera(16);
        }
    }
    async function esconderDedo() {
        await page.evaluate(([x, y]) => window.palco.dedo(x, y, { visivel: false }), [pos.x, pos.y]);
        await page.mouse.move(2, 2); // fora do iframe — as partículas voltam ao lugar
    }
    async function tocar(locator, ms = 550) {
        await locator.scrollIntoViewIfNeeded();
        const b = await locator.boundingBox(); // coordenadas já relativas ao palco
        await mover(b.x + b.width / 2, b.y + b.height / 2, ms);
        await page.evaluate(([x, y]) => window.palco.dedo(x, y, { press: true }), [pos.x, pos.y]);
        await espera(140);
        await page.mouse.down(); await page.mouse.up();
        await espera(120);
        await page.evaluate(([x, y]) => window.palco.dedo(x, y), [pos.x, pos.y]);
    }
    // Rolagem suave dentro do site, com o dedo fazendo o gesto de arrastar
    async function rolarAte(site, alvo, ms = 1100) {
        const iframe = await page.$('#site').then(e => e.boundingBox());
        const x = iframe.x + iframe.width * 0.72;
        await mover(x, iframe.y + iframe.height * 0.78, 300);
        const rolagem = site.evaluate(([alvo, ms]) => new Promise(res => {
            const y0 = scrollY, y1 = typeof alvo === 'number' ? alvo
                : document.querySelector(alvo).getBoundingClientRect().top + scrollY - 96;
            const t0 = performance.now();
            const ease = t => 1 - Math.pow(1 - t, 3);
            (function passo(t) {
                const k = Math.min(1, (t - t0) / ms);
                scrollTo(0, y0 + (y1 - y0) * ease(k));
                k < 1 ? requestAnimationFrame(passo) : res();
            })(t0);
        }), [alvo, ms]);
        await Promise.all([rolagem, mover(x, iframe.y + iframe.height * 0.3, ms * 0.8)]);
        await espera(150);
    }

    // ===================== ROTEIRO =====================
    const t0 = Date.now();
    const marca = (nome) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${nome}`);

    // Abertura + tela de carregamento
    marca('abertura');
    await legenda(TEXTOS.abertura);
    await espera(1200);
    await page.evaluate((src) => window.palco.carregarSite(src), `${BASE}${SITE}`);
    const site = await (await page.waitForSelector('#site')).contentFrame();
    await site.waitForLoadState('domcontentloaded');
    await espera(900);
    marca('carregamento');
    await legenda(TEXTOS.carregamento);
    await site.waitForSelector('#loading-screen', { state: 'detached', timeout: 10000 });
    await espera(1500);

    // Partículas — o dedo "varre" o nome da banda
    marca('particulas');
    await legenda(TEXTOS.particulas);
    const titulo = await site.locator('#main-title').boundingBox();
    const cx = titulo.x, cy = titulo.y, w = titulo.width, h = titulo.height;
    await mover(cx - 10, cy + h * 0.28, 400);
    await mover(cx + w + 10, cy + h * 0.22, 1100);
    await mover(cx + w * 0.8, cy + h * 0.5, 300);
    await mover(cx - 10, cy + h * 0.74, 1100);
    await mover(cx + w * 0.4, cy + h * 0.45, 400);
    await esconderDedo();
    await espera(1100);

    // Transição hero → dashboard
    marca('transicao');
    await legenda(TEXTOS.transicao);
    await espera(700);
    await tocar(site.locator('#pala-text'));
    await esconderDedo();
    await espera(1400);

    // História → modal "Saiba mais"
    marca('historia');
    await legenda(TEXTOS.historia);
    await espera(500);
    await tocar(site.locator('#historia button'));
    await espera(1000);
    await site.locator('#modal-historia > div').evaluate(el => el.scrollTo({ top: 220, behavior: 'smooth' }));
    await espera(1100);
    await tocar(site.locator('#modal-historia button').first());
    await espera(400);

    // Discografia → ampliar capa
    marca('discografia');
    await legenda(TEXTOS.discografia);
    await rolarAte(site, '#discografia');
    await espera(500);
    await tocar(site.locator('#discografia img').nth(3));
    await espera(1400);
    await tocar(site.locator('#modal-image button'));
    await espera(400);

    // Galeria → carrossel
    marca('galeria');
    await legenda(TEXTOS.galeria);
    await rolarAte(site, '#fotos');
    await espera(400);
    await tocar(site.locator('#fotos img').first());
    await espera(900);
    const proxima = site.locator('#modal-gallery button[onclick^="nextGalleryImage"]');
    for (let i = 0; i < 2; i++) { await tocar(proxima, 300); await espera(650); }
    await tocar(site.locator('#gallery-thumbnails img').nth(8), 450);
    await espera(900);
    await tocar(site.locator('#modal-gallery > button'));
    await espera(400);

    // Tema claro/escuro
    marca('tema');
    await legenda(TEXTOS.tema);
    await espera(300);
    await tocar(site.locator('#theme-toggle'));
    await esconderDedo();
    await espera(1300);

    // Contato — digita e envia (o mailto é barrado dentro do iframe; o feedback do botão aparece)
    marca('contato');
    await legenda(TEXTOS.contato);
    await rolarAte(site, '#contacto');
    const form = site.locator('#contacto form');
    await tocar(form.locator('[name=nome]'), 450);
    await form.locator('[name=nome]').pressSequentially('Festival Sonora', { delay: 35 });
    await tocar(form.locator('[name=email]'), 350);
    await form.locator('[name=email]').pressSequentially('oi@festival.com', { delay: 25 });
    await tocar(form.locator('[name=mensagem]'), 350);
    await form.locator('[name=mensagem]').pressSequentially('Queremos vocês no line-up!', { delay: 30 });
    await espera(300);
    await tocar(form.locator('button[type=submit]'));
    await espera(1400);

    // Links e PIX
    marca('pix');
    await legenda(TEXTOS.pix);
    await rolarAte(site, '#links', 900);
    await espera(400);
    await tocar(site.locator('#contacto button[onclick^="copyPix"]'));
    await esconderDedo();
    await espera(1300);

    // Volta ao tema escuro e ao topo enquanto mostra onde o site roda
    marca('wordpress');
    await legenda(TEXTOS.wordpress);
    await tocar(site.locator('#theme-toggle'), 450);
    await esconderDedo();
    await espera(400);
    await site.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' }));
    await espera(1400);
    // Toque final nas partículas antes do encerramento
    await mover(cx + w * 0.1, cy + h * 0.5, 400);
    await mover(cx + w * 0.9, cy + h * 0.45, 1100);
    await esconderDedo();
    await espera(800);

    marca('final');
    await palco('final', TEXTOS.final);
    await espera(4000);
    marca('fim');

    await cdp.send('Page.stopScreencast');
    await espera(300);
    await browser.close();

    // --- Monta o MP4: cada quadro dura até o próximo (tempo real) ---
    const lista = path.join(SAIDA, 'quadros.txt');
    const linhas = [];
    for (let i = 0; i < quadros.length; i++) {
        const dur = i + 1 < quadros.length ? quadros[i + 1].t - quadros[i].t : 0.5;
        linhas.push(`file '${quadros[i].arq}'`, `duration ${Math.max(dur, 0.001).toFixed(4)}`);
    }
    linhas.push(`file '${quadros[quadros.length - 1].arq}'`);
    fs.writeFileSync(lista, linhas.join('\n'));

    const mp4 = path.join(SAIDA, 'pinkopala-reel.mp4');
    execFileSync('ffmpeg', [
        '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista,
        '-vf', `fps=${FPS},scale=1080:1920:flags=lanczos,format=yuv420p`,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
        '-movflags', '+faststart', '-an', mp4,
    ], { stdio: 'inherit' });

    const dur = quadros[quadros.length - 1].t - quadros[0].t;
    console.log(`\n${quadros.length} quadros capturados, ${dur.toFixed(1)} s → ${mp4}`);
})().catch(e => { console.error(e); process.exit(1); });
