import { create } from "zustand";
import type { Customer } from "@/types";
import { mockCustomers } from "@/data/mock";

interface CustomersState {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  getCustomerById: (id: string) => Customer | undefined;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  addVehicleToCustomer: (customerId: string, vehicleId: string) => void;
  deleteCustomer: (id: string) => void;
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: mockCustomers,

  setCustomers: (customers) => set({ customers }),

  getCustomerById: (id) => get().customers.find((c) => c.id === id),

  addCustomer: (customer) => set((state) => ({ customers: [customer, ...state.customers] })),

  updateCustomer: (id, data) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      ),
    })),

  addVehicleToCustomer: (customerId, vehicleId) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId && !c.vehicleIds.includes(vehicleId)
          ? {
              ...c,
              vehicleIds: [...c.vehicleIds, vehicleId],
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    })),

  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),
}));
