export interface Product {
  slug: string;
  name: string;
  short: string;
  desc: string;
  category: 'Kasa & Luka' | 'Kebersihan & Antiseptik' | 'Proteksi' | 'Pendukung Klinis';
}

// Placeholders deduced from current site (Sterile Gauze, Folded Gauze).
// Swap name/desc later — no code changes needed, just edit this file.
export const products: Product[] = [
  {
    slug: 'sterile-gauze',
    name: 'Sterile Gauze (Kasa Steril)',
    short: 'Kasa steril daya serap tinggi',
    desc: 'Kasa steril dengan daya serap tinggi, aman untuk perawatan luka bedah dan klinis.',
    category: 'Kasa & Luka',
  },
  {
    slug: 'folded-gauze',
    name: 'Folded Gauze (Kasa Lipat)',
    short: 'Kasa lipat higienis siap pakai',
    desc: 'Kasa lipat higienis, mudah diaplikasikan untuk tindakan klinis dan gawat darurat.',
    category: 'Kasa & Luka',
  },
  {
    slug: 'elastic-bandage',
    name: 'Elastic Bandage (Perban Elastis)',
    short: 'Fiksasi luka yang nyaman',
    desc: 'Perban elastis untuk fiksasi kasa dan balutan luka dengan tekanan merata.',
    category: 'Kasa & Luka',
  },
  {
    slug: 'alcohol-swab',
    name: 'Alcohol Swab',
    short: 'Antiseptik sekali pakai',
    desc: 'Tisu alkohol sekali pakai untuk desinfeksi kulit sebelum injeksi dan tindakan minor.',
    category: 'Kebersihan & Antiseptik',
  },
  {
    slug: 'surgical-gloves',
    name: 'Surgical Gloves (Sarung Tangan Steril)',
    short: 'Proteksi steril tenaga medis',
    desc: 'Sarung tangan steril sekali pakai untuk tindakan bedah dan klinis.',
    category: 'Proteksi',
  },
  {
    slug: 'surgical-mask',
    name: 'Surgical Mask (Masker Medis)',
    short: 'Masker medis 3-ply',
    desc: 'Masker medis 3 lapis untuk proteksi droplet di fasilitas kesehatan.',
    category: 'Proteksi',
  },
  {
    slug: 'wound-plaster',
    name: 'Wound Plaster (Plester Luka)',
    short: 'Plester luka breathable',
    desc: 'Plester luka breathable dengan bantalan penyerap untuk luka ringan.',
    category: 'Kasa & Luka',
  },
  {
    slug: 'underpad',
    name: 'Underpad (Alas Pasien)',
    short: 'Alas pasien daya serap tinggi',
    desc: 'Alas pasien sekali pakai untuk menjaga kebersihan bed dan tindakan klinis.',
    category: 'Pendukung Klinis',
  },
];
