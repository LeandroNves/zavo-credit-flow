import {
  ALL_INSTALLMENTS,
  type LandingProduct,
  makeProductId,
} from "@/lib/productsStore";
import iphone17Digital from "@/assets/iPhone-17-Digital-PNG.png";
import iphone17Enhanced from "@/assets/iPhone-17-Enhanced-Audio-Quality-PNG.png";
import iphone17Branco from "@/assets/iphone17branco.png";

/** Seed só quando não há Supabase (catálogo local). Não grava no banco automaticamente. */
export const landingProductSeed: LandingProduct[] = [
  {
    id: makeProductId(),
    name: "iPhone 17 Pro max",
    color: "Laranja",
    description: "",
    specifications: [],
    imageSrc: iphone17Digital,
    imageSrcs: [iphone17Digital, iphone17Enhanced, iphone17Branco],
    priceCents: 0,
    enabledMonths: [...ALL_INSTALLMENTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: makeProductId(),
    name: "iPhone 17",
    color: "Titânio Azul",
    description: "",
    specifications: [],
    imageSrc: iphone17Enhanced,
    imageSrcs: [iphone17Enhanced, iphone17Digital],
    priceCents: 0,
    enabledMonths: [...ALL_INSTALLMENTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: makeProductId(),
    name: "iPhone 17 Pro Max",
    color: "Titânio Branco",
    description: "",
    specifications: [],
    imageSrc: iphone17Branco,
    imageSrcs: [iphone17Branco, iphone17Digital],
    priceCents: 0,
    enabledMonths: [...ALL_INSTALLMENTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
