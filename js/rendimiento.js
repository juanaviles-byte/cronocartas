// «Modo escuela»: un perfil liviano para las tablets del colegio (Galaxy Tab A 8.0 de 2019:
// Snapdragon 429, GPU Adreno 504 y 2 GB de memoria). Mantiene las animaciones de las cartas,
// que son baratas, y apaga lo que más le cuesta a una GPU modesta: partículas, desenfoques,
// brillos que se repintan en cada cuadro y la narración guardada en memoria.

// ajustes.modoEscuela: true o false si el docente lo eligió; sin elegir, se decide solo.
export function modoEscuelaActivo(ajustes, ua, memoriaGB) {
  if (ajustes && typeof ajustes.modoEscuela === 'boolean') return ajustes.modoEscuela;
  return /SM-T29[05]\b/.test(ua || '') || (typeof memoriaGB === 'number' && memoriaGB <= 2);
}

// ¿Está activo ahora? (la clase la pone app.js al arrancar y el panel docente al cambiarlo)
export const liviano = () => typeof document !== 'undefined' && document.documentElement.classList.contains('modo-escuela');
