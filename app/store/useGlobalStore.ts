import { create } from "zustand";

type GlobalState = {
  country: string;
  language: string;
  currency: string;
  setGlobalCountry: (region: { country: string }) => void;
  setGlobalLanguage: (language: { language: string }) => void;
  setGlobalCurrency: (currency: { currency: string }) => void;
};

export const useGlobalStore = create<GlobalState>((set) => ({
  country: "",
  language: "",
  currency: "",
  setGlobalCountry: ({ country }) => set({ country }),
  setGlobalLanguage: ({ language }) => set({ language }),
  setGlobalCurrency: ({ currency }) => set({ currency }),
}));
