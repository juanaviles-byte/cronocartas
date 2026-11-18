// Pregunta antes de una acción que no se puede deshacer. Devuelve una promesa con true o false.
// Los textos son fijos del juego (no vienen del usuario).
export function confirmar({ titulo, texto, si, no = 'Cancelar', girado = false, dentro = document.body }) {
  return new Promise(resolve => {
    const capa = document.createElement('div');
    capa.className = `capa capa-confirmar${girado ? ' girado' : ''}`;
    const panel = document.createElement('div');
    panel.className = 'panel-aviso confirmar';
    panel.setAttribute('role', 'alertdialog');
    const t = document.createElement('div'); t.className = 'titulo-sabias'; t.textContent = titulo;
    const p = document.createElement('p'); p.textContent = texto;
    const botones = document.createElement('div'); botones.className = 'botones';
    const bNo = document.createElement('button'); bNo.className = 'boton-secundario'; bNo.textContent = no;
    const bSi = document.createElement('button'); bSi.className = 'boton-principal boton-peligro'; bSi.textContent = si;
    const fin = v => { capa.remove(); resolve(v); };
    bNo.onclick = () => fin(false);
    bSi.onclick = () => fin(true);
    capa.onclick = ev => { if (ev.target === capa) fin(false); };
    botones.append(bNo, bSi);
    panel.append(t, p, botones);
    capa.appendChild(panel);
    dentro.appendChild(capa);
    bNo.focus();
  });
}
