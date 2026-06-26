import {
  ALL_INSTALLMENTS,
  type LandingProduct,
  makeProductId,
} from "@/lib/productsStore";
import iphone17Digital from "@/assets/iPhone-17-Digital-PNG.png";
import iphone17Enhanced from "@/assets/iPhone-17-Enhanced-Audio-Quality-PNG.png";
import iphone17Branco from "@/assets/iphone17branco.png";

const seedDefaults = {
  category: "Celular" as const,
  brand: "Apple" as const,
  isOnSale: false,
  singleColor: false,
  description: "",
  deliveryTime: "",
  specifications: [] as string[],
  modelOptions: [] as LandingProduct["modelOptions"],
};

/** Seed só quando não há Supabase (catálogo local). Não grava no banco automaticamente. */
export const landingProductSeed: LandingProduct[] = [
  {
    ...seedDefaults,
    id: makeProductId(),
    name: "iPhone 17 Pro max",
    color: "Laranja",
    imageSrc: iphone17Digital,
    imageSrcs: [iphone17Digital, iphone17Enhanced, iphone17Branco],
    priceCents: 0,
    enabledMonths: [...ALL_INSTALLMENTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    ...seedDefaults,
    id: makeProductId(),
    name: "iPhone 17",
    color: "Titânio Azul",
    imageSrc: iphone17Enhanced,
    imageSrcs: [iphone17Enhanced, iphone17Digital],
    priceCents: 0,
    enabledMonths: [...ALL_INSTALLMENTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    ...seedDefaults,
    id: makeProductId(),
    name: "iPhone 17 Pro Max",
    color: "Titânio Branco",
    imageSrc: iphone17Branco,
    imageSrcs: [iphone17Branco, iphone17Digital],
    priceCents: 0,
    enabledMonths: [...ALL_INSTALLMENTS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
