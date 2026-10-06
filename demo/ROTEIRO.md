# Reel de demonstração — site Pink Opala

Vídeo vertical **9:16 (1080×1920), 30 fps, H.264, sem áudio** — a música da banda entra pelo próprio Instagram. Duração ~75 s.

O vídeo é **gravado automaticamente**: o site real roda dentro de um "celular" (iframe 360×640, layout mobile de verdade) e um script interage com ele como um usuário, enquanto legendas no topo explicam cada solução.

## Como gerar

```bash
# na raiz do repositório
python3 -m http.server 8080 &
NODE_PATH="$(npm root -g)" node demo/gravar-reel.cjs
# → demo/saida/pinkopala-reel.mp4 (a pasta saida/ não vai pro git)
```

Requisitos: Playwright (`npm i -g playwright`), ffmpeg e internet (Tailwind, Lucide e Google Fonts vêm de CDN).

Os **textos** ficam no objeto `TEXTOS` no topo de `gravar-reel.cjs`; o **visual** do palco (cores, tamanhos, posição da legenda) fica em `palco.html`. A legenda fica no topo de propósito: a parte de baixo do Reel é coberta pelo nome/legenda do post e os botões do Instagram.

## Cenas

| # | Tempo | Na tela | Legenda |
|---|---|---|---|
| — | 0–3 s | Tela de carregamento enchendo de rosa | **Fiz o site da Pink Opala** — banda indie pop de Goiânia |
| 01 | 3–5 s | Site abre | **Abre em segundos** — entrada espera só as fontes (~100 KB) |
| 02 | 5–13 s | Dedo "varre" o nome; partículas se espalham e voltam | **O nome vira areia** — física de mola em Canvas, zero bibliotecas |
| 03 | 13–17 s | Toque no título, dashboard desliza | **Um toque e desliza** — sem salto no celular |
| 04 | 17–24 s | "Saiba mais" abre a história | **Tudo numa página** — janelas leves |
| 05 | 24–32 s | Capa ampliada | **Capas e downloads** — MP3 e WAV |
| 06 | 32–45 s | Galeria em carrossel | **57 MB → 4,5 MB** — WebP (−92%), galeria sob demanda |
| 07 | 45–48 s | Troca para tema claro | **Claro ou escuro** |
| 08 | 48–60 s | Formulário preenchido e enviado | **E-mail já redigido** — sem servidor, sem spam |
| 09 | 60–66 s | Copiar PIX | **PIX em um toque** |
| 10 | 66–73 s | Volta ao escuro, topo, partículas | **HTML puro ou WordPress** — versão Elementor isolada do tema |
| — | 73–77 s | Encerramento | **Quer um site assim?** · Me chama na DM · pinkopala.com |

## Sugestão de legenda do post

> Fiz o site oficial da @pinkopala 🩷 — e quis que ele tivesse a cara da banda.
>
> ✦ o nome vira areia e reage ao seu toque
> ✦ abre em segundos (as fotos caíram de 57 MB pra 4,5 MB)
> ✦ discografia com download, galeria, tema claro/escuro
> ✦ contato que já chega redigido no seu e-mail, sem formulário que vira spam
> ✦ roda em HTML puro ou dentro do WordPress/Elementor
>
> Veja ao vivo: pinkopala.com
>
> Tem uma banda, um projeto artístico, um festival ou uma instituição e quer um site assim, sob medida? Me chama na DM 💌
>
> 🎵 trilha: Pink Opala
>
> #webdesign #desenvolvimentoweb #sitedebanda #musicaindependente #indiepop #goiania #frontend #portfolio #criativo #pinkopala

Dica: no Instagram, adicione a música da Pink Opala pelo editor do Reel e use a capa (frame) do nome em partículas ou do encerramento.
