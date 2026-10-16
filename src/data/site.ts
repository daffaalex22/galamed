import raw from './site.json';

// site.json is edited via Decap CMS (/admin → Pengaturan Situs).
// wa.me requires digits only, no +, spaces, dashes.
const waNumber: string = raw.waNumber;

export const site = {
  ...raw,
  waNumber,
  waLink: `https://wa.me/${waNumber}?text=Halo%20Galamed,%20saya%20ingin%20minta%20penawaran.`,
};
