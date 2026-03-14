import { create } from "zustand";
import type { Service } from "@/types";
import { mockServices } from "@/data/mock";

interface ServicesState {
  services: Service[];
  setServices: (services: Service[]) => void;
  getServiceById: (id: string) => Service | undefined;
  addService: (service: Service) => void;
  updateService: (id: string, data: Partial<Service>) => void;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: mockServices,

  setServices: (services) => set({ services }),

  getServiceById: (id) => get().services.find((s) => s.id === id),

  addService: (service) =>
    set((state) => ({ services: [service, ...state.services] })),

  updateService: (id, data) =>
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
      ),
    })),
}));
