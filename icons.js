/* Giappone 2026 — icone dei posti: SVG in linea, viewBox 32, monolinea a inchiostro (currentColor), al massimo un riempimento vermiglio */
(function(){
"use strict";
const S=b=>'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+b+'</svg>';
const R='style="fill:var(--shu)"';
const MARKET='<path d="M4 9h24l-2 6H6z"/><path d="M10 9l-1 6M16 9v6M22 9l1 6"/><path d="M7 15v12M25 15v12M4 27h24"/><path d="M11 27v-6h10v6M11 24h10"/>';
const BAR='<path d="M7 8h18l-2 19H9z"/><path d="M8 14h16"/><path d="M11 17l5-1 1 5-5 1z"/><path d="M17 20l4 1-1 4"/>';
const IZAKAYA='<path d="M16 2v3M12 5h8M12 27h8"/><path '+R+' d="M12 5c-5 2-7 6-7 11s2 9 7 11h8c5-2 7-6 7-11s-2-9-7-11z"/><path d="M6 11h20M5 16h22M6 21h20"/>';
window.ICONS={
  /* piatti */
  ramen:S('<path d="M4 16h24c0 6-5 10-12 10S4 22 4 16z"/><path d="M12 29h8"/><path d="M15 15 27 4M19 15l10-8"/><path d="M8 12c-1.5-2 1.5-3 0-5M12 11c-1.5-2 1.5-3 0-5"/>'),
  sushi:S('<path d="M3 24h26M7 24v4M25 24v4"/><path d="M6 23v-2a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v2"/><path '+R+' d="M4 18c2-4 10-5 12-1-3 2-9 2-12 1z"/><path d="M18 23v-2a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2"/><path d="M16.5 18c2-4 10-5 12-1-3 2-9 2-12 1z"/>'),
  tonkatsu:S('<path d="M17 13c0-4 4-6 7-4 3-1 6 2 4 6"/><path d="M3 21l4-8h17l-4 8z"/><path d="M11 13l-4 8M15.5 13l-4 8M20 13l-4 8"/><path d="M3 26h26"/>'),
  gyukatsu:S('<rect x="3" y="11" width="8" height="12" rx="2"/><rect x="12" y="11" width="8" height="12" rx="2"/><rect x="21" y="11" width="8" height="12" rx="2"/><path '+R+' stroke="none" d="M6 14h2v6H6zM15 14h2v6h-2zM24 14h2v6h-2z"/><path d="M3 27h26"/>'),
  wagyu:S('<path d="M6 9c4-4 12-4 18-1 5 3 6 9 3 13-3 5-10 7-16 6-6-1-8-6-8-10 0-3 1-6 3-8z"/><path d="M7 13c4 0 6 3 9 3s5 3 9 3"/><path d="M10 8c2 3 5 3 6 6M9 20c3-1 5 2 8 1"/>'),
  yakiniku:S('<path d="M4 18h24"/><path d="M7 18l2 9h14l2-9"/><path d="M8 15c1-3 6-3 7 0M17 15c1-3 6-3 7 0"/><path d="M27 2l-5 11M27 2l1 11"/>'),
  yakitori:S('<path d="M3 21 21 3M11 29 29 11"/><circle cx="8" cy="16" r="3"/><circle cx="13" cy="11" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="16" cy="24" r="3"/><circle cx="21" cy="19" r="3"/><circle cx="26" cy="14" r="3"/>'),
  tempura:S('<path d="M6 26c-3-3 0-7 4-11s9-8 12-7c2 2-1 6-5 10s-8 10-11 8z"/><path d="M9 18l3 3M13 14l3 3M17 11l2 2"/><path '+R+' d="M22 8l1-5 6 4z"/><path d="M3 29h26"/>'),
  soba:S('<path d="M4 20h24l-3 6H7z"/><path d="M8 20c0-6 16-6 16 0"/><path d="M11 17c2 1 3-1 5 0s3-1 5 0"/><path d="M5 7l22 5M5 11l22 3"/>'),
  onigiri:S('<path d="M16 4c-2 0-11 15-11 19 0 4 22 4 22 0 0-4-9-19-11-19z"/><path d="M11 27v-7h10v7"/><circle '+R+' cx="16" cy="14" r="2.5"/>'),
  gyoza:S('<path d="M2 21a5 5 0 0 1 10 0z"/><path d="M11 21a5 5 0 0 1 10 0z"/><path d="M20 21a5 5 0 0 1 10 0z"/><path d="M7 16v-2M16 16v-2M25 16v-2"/><path d="M3 25h26"/>'),
  okonomiyaki:S('<ellipse cx="16" cy="18" rx="13" ry="8"/><path d="M8 18l3-3 3 4 3-4 3 4 3-3"/><path d="M6 6l6 6M5 9l3-3"/>'),
  takoyaki:S('<path d="M3 23h26l-3 5H6z"/><circle cx="9" cy="19" r="4"/><circle cx="18" cy="19" r="4"/><circle cx="13.5" cy="12" r="4"/><path d="M17 9l9-7"/>'),
  kushikatsu:S('<path d="M5 20h22c0 5-5 8-11 8S5 25 5 20z"/><path d="M10 20 9 15M16 20v-5M22 20l1-5"/><rect x="6" y="4" width="5" height="11" rx="2.5"/><rect x="13.5" y="3" width="5" height="12" rx="2.5"/><rect x="21" y="4" width="5" height="11" rx="2.5"/>'),
  omurice:S('<path d="M5 22c0-7 5-11 11-11s11 4 11 11z"/><path d="M3 26h26"/><path '+R+' d="M10 16c3-3 9-3 12 0-3 2-9 2-12 0z"/>'),
  sando:S('<path d="M18 8l11-1-3 18"/><path d="M3 26 15 7l12 19z"/><path '+R+' d="M10.5 15h9l3 5h-15z"/>'),
  hamburg:S('<ellipse cx="16" cy="22" rx="14" ry="5"/><path d="M8 21c0-5 4-8 8-8s8 3 8 8c-3 2-13 2-16 0z"/><path d="M10 16c3 2 9 2 12 0"/><path d="M14 9c-1-2 1-3 0-5M19 9c-1-2 1-3 0-5"/>'),
  sweets:S('<path d="M5 27l3-3M24 8l3-3"/><circle cx="11" cy="21" r="4"/><circle cx="16" cy="16" r="4"/><circle '+R+' cx="21" cy="11" r="4"/>'),
  cafe:S('<path d="M7 13h15v5c0 5-3 8-7.5 8S7 23 7 18z"/><path d="M22 15h2a3 3 0 0 1 0 6h-2.5"/><path d="M4 29h22"/><path d="M12 9c-1-2 1-3 0-5M17 9c-1-2 1-3 0-5"/>'),
  bar:S(BAR),
  sake:S('<path d="M9 3h5M10 3c0 4-1 6-3 8-3 4-3 10 0 15h9c3-5 3-11 0-15-2-2-3-4-3-8"/><path d="M20 20h9l-1.5 7h-6z"/>'),
  whisky:S('<path d="M8 3h5v5c3 1 4 3 4 6v14H4V14c0-3 1-5 4-6z"/><path '+R+' d="M4 16h13v6H4z"/><path d="M20 16h9l-1 11h-7z"/>'),
  izakaya:S(IZAKAYA),
  market:S(MARKET),
  /* luoghi */
  temple:S('<path d="M16 2v4"/><path d="M8 10c4 0 6-2 8-4 2 2 4 4 8 4"/><path d="M11 10v3h10v-3"/><path d="M6 17c4 0 7-2 10-4 3 2 6 4 10 4"/><path d="M10 17v4h12v-4"/><path d="M4 25c5 0 8-2 12-4 4 2 7 4 12 4"/><path d="M10 25v4h12v-4"/>'),
  shrine:S('<path '+R+' d="M3 6c5 1 21 1 26 0l-1 4c-5 1-19 1-24 0z"/><path d="M5 14h22M16 10v4M9 10v19M23 10v19"/>'),
  view:S('<path d="M16 4 10 28M16 4l6 24M12 20h8M13.5 13h5"/><path d="M2 28h28M3 28v-7h4v7M25 28v-5h4v5"/><circle '+R+' cx="25" cy="8" r="3.5"/>'),
  garden:S('<path d="M5 28c1-4 4-6 8-6s9 1 12 3c1 1 2 2 2 3"/><path d="M15 22c1-5-3-8 0-13"/><path d="M5 12c2-3 8-3 10 0z"/><path d="M12 7c2-3 8-3 10 0z"/><path d="M17 15c2-3 8-3 10 0z"/>'),
  museum:S('<path d="M4 10 16 4l12 6z"/><path d="M5 13h22M4 27h24M6 24h20"/><path d="M8 13v11M13 13v11M19 13v11M24 13v11"/>'),
  castle:S('<path d="M7 28l2-7h14l2 7z"/><path d="M5 21c3 0 5-1 6-3h10c1 2 3 3 6 3"/><path d="M11 18v-4h10v4"/><path d="M7 14c3 0 4-1 5-3h8c1 2 2 3 5 3"/><path d="M13 11V8h6v3"/><path d="M10 8c3 0 4-2 6-5 2 3 3 5 6 5"/>'),
  park:S('<path d="M8 15h12c3 0 4 2 4 4"/><path d="M9 15c-2 0-3 2-3 4"/><path d="M9 19v9M12 19v9M20 19v9M23 19v9"/><path d="M8 19h16"/><path d="M20 15l3-7h3l1 2-3 1"/><path d="M23 8l-2-5M23 8l3-5M21 5l-2-1"/>'),
  street:S('<path d="M2 5c8 5 20 5 28 0"/><path d="M8 8v2M16 9v2M24 8v2"/><ellipse cx="8" cy="13" rx="2.5" ry="3"/><ellipse '+R+' cx="16" cy="14" rx="2.5" ry="3"/><ellipse cx="24" cy="13" rx="2.5" ry="3"/><path d="M6 29l6-9M26 29l-6-9"/>'),
  onsen:S('<path d="M7 18c-3 2-3 5 0 7 5 4 13 4 18 0 3-2 3-5 0-7"/><path d="M11 20c-2-3 2-5 0-8s2-5 0-8M16 20c-2-3 2-5 0-8s2-5 0-8M21 20c-2-3 2-5 0-8s2-5 0-8"/>'),
  /* sera */
  club:S('<path d="M9 22V7l10-3v15"/><circle cx="6.5" cy="22" r="2.5"/><circle cx="16.5" cy="19" r="2.5"/><path d="M20 14h9l-4.5 6zM24.5 20v6M22 27h5"/>'),
  karaoke:S('<circle cx="20" cy="11" r="6"/><path d="M15.5 15 6 26"/><path d="M6 26c-2 2 0 5 3 3"/><path d="M16 8l7 7"/><path d="M27 19c1.5 2 1.5 5 0 7"/>'),
  /* negozi */
  shop:S('<path d="M7 11h18l-1 17H8z"/><path d="M12 14V9a4 4 0 0 1 8 0v5"/>'),
  records:S('<circle cx="16" cy="16" r="12"/><circle '+R+' cx="16" cy="16" r="4"/><path d="M8 12a9 9 0 0 1 4-4M24 20a9 9 0 0 1-4 4"/>'),
  vintage:S('<path d="M16 7c0-2 2-3 3-2"/><path d="M16 7 4 12h24z"/><path d="M8 12l-4 4 3 3 2-2v11h14V17l2 2 3-3-4-4"/><path d="M13 12l3 4 3-4"/>'),
  books:S('<path d="M16 8c-3-2-8-3-12-2v18c4-1 9 0 12 2 3-2 8-3 12-2V6c-4-1-9 0-12 2z"/><path d="M16 8v18"/><path '+R+' d="M21 6.5h3v8l-1.5-1.5-1.5 1.5z"/>'),
  game:S('<path d="M5 22h22v6H5z"/><path d="M16 22v-9"/><circle '+R+' cx="16" cy="9" r="4"/><path d="M22 22v-2M9 25h3"/>'),
  /* spostamenti */
  train:S('<path d="M3 22h17c5 0 8-2 9-5-3-3-8-5-14-5H3"/><path d="M21 13c2 0 4 1 5 3h-6z"/><path d="M6 16h3M12 16h3"/><path d="M3 26h26"/>'),
  ferry:S('<path d="M3 20h26l-4 6H7z"/><path d="M9 20v-5h12v5"/><path '+R+' d="M13 15v-5h4v5z"/><path d="M3 29c2-1 4 1 6 0s4 1 6 0 4 1 6 0 4 1 6 0"/>'),
  bus:S('<rect x="6" y="4" width="20" height="21" rx="3"/><path d="M6 14h20M10 20h1M21 20h1M10 25v3M22 25v3M4 8v4M28 8v4"/>'),
  /* assaggi */
  camera:S('<path d="M4 11h5l2.5-4h9L23 11h5v15H4z"/><circle cx="16" cy="18" r="5"/><circle '+R+' cx="24.5" cy="14.5" r="1.6"/>'),
  book:S('<path d="M5 6h9a2 2 0 0 1 2 2v19a2 2 0 0 0-2-2H5z"/><path d="M27 6h-9a2 2 0 0 0-2 2v19a2 2 0 0 1 2-2h9z"/><rect '+R+' x="20" y="10" width="4" height="4"/>'),
  /* meteo */
  sun:S('<circle '+R+' cx="16" cy="16" r="6"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/>'),
  cloud:S('<circle '+R+' cx="21" cy="10" r="4"/><path d="M21 3v1.5M27.5 10H29M25.6 5.4l1-1"/><path d="M8 25h15a5 5 0 0 0 .5-10 7 7 0 0 0-13.4 1.6A4.3 4.3 0 0 0 8 25z"/>'),
  moon:S('<path d="M20.5 4.5a11.5 11.5 0 1 0 7 18.6A9.6 9.6 0 0 1 20.5 4.5z"/><circle '+R+' cx="25" cy="9" r="1.6"/>'),
  /* guida "Installa l'app": la bussola di Safari, Condividi, Aggiungi alla schermata Home */
  compass:S('<circle cx="16" cy="16" r="12.5"/><path d="M16 4.5v2M16 25.5v2M4.5 16h2M25.5 16h2"/><path '+R+' d="M21.5 10.5 17.6 17.6 14.4 14.4z"/><path d="M14.4 14.4 10.5 21.5l7.1-3.9"/>'),
  share:S('<path d="M11.5 12.5H8V28h16V12.5h-3.5"/><path d="M16 3.5V20M11 8.5l5-5 5 5"/>'),
  addhome:S('<rect x="5" y="5" width="22" height="22" rx="5"/><path d="M16 10.5v11M10.5 16h11"/>'),
  /* freccia tra due codici (FCO, DOH) o due nomi: tabellone delle partenze, rotta delle sei fasi */
  arrow:S('<path d="M5 16h21M19 9l7 7-7 7"/>'),
  rain:S('<path d="M8 19h15a5 5 0 0 0 .5-10 7 7 0 0 0-13.4 1.6A4.3 4.3 0 0 0 8 19z"/><path d="M10 23l-1.5 4M22 23l-1.5 4"/><path '+R+' d="M15.5 22c-2.6 3.2-2.6 6 0 6s2.6-2.8 0-6z"/>')
};
})();
