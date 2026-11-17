// PIN docente de 4 dígitos. No es seguridad fuerte: solo evita que los
// estudiantes entren al panel por accidente. Se guarda una huella, no el PIN.

export const pinValido = p => typeof p === 'string' && /^\d{4}$/.test(p);

export function huellaPin(pin) {
  // FNV-1a de 32 bits con sal fija.
  let h = 0x811c9dc5;
  for (const ch of `cronocartas:${pin}`) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const verificarPin = (pin, huella) => pinValido(pin) && huellaPin(pin) === huella;
