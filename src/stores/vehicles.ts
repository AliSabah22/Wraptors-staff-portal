import { create } from "zustand";
import type { Vehicle } from "@/types";
import { mockVehicles } from "@/data/mock";

interface VehiclesState {
  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;
  getVehicleById: (id: string) => Vehicle | undefined;
  addVehicle: (vehicle: Vehicle) => void;
  addJobToVehicle: (vehicleId: string, jobId: string) => void;
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: mockVehicles,

  setVehicles: (vehicles) => set({ vehicles }),

  getVehicleById: (id) => get().vehicles.find((v) => v.id === id),

  addVehicle: (vehicle) => set((state) => ({ vehicles: [vehicle, ...state.vehicles] })),

  addJobToVehicle: (vehicleId, jobId) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === vehicleId && !v.serviceJobIds.includes(jobId)
          ? {
              ...v,
              serviceJobIds: [...v.serviceJobIds, jobId],
              updatedAt: new Date().toISOString(),
            }
          : v
      ),
    })),
}));
