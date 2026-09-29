# RedSkill — deploy

Pacote de publicação baseado na direção final da V29.

## Entrada

- `index.html`

## Assets

- `assets/css/base.css` — sistema visual e layout principal.
- `assets/css/mascot.css` — mascote e cards de serviços.
- `assets/css/contact.css` — formulário, radar e composição do contato.
- `assets/css/site.css` — ajustes finais do hero.
- `assets/js/core.js` — tema, glitch, navegação, formulário e animações-base.
- `assets/js/mascot.js` — parallax, piscadas, rabo e serviços.
- `assets/js/radar.js` — interação do radar.
- `assets/js/hero.js` — interação do mascote no hero.
- `assets/js/contact.js` — envio ao Cloudflare Worker, Turnstile e estados do formulário.
- `assets/images/` — logos e imagens do mascote.

O formulário usa honeypot e Cloudflare Turnstile antes de enviar JSON ao Cloudflare Worker configurado em `assets/js/contact.js`.
