export type HydrantStatus = "otimo" | "bom" | "regular" | "pessimo" | "inativo";

export interface Hydrant {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  photoUrl: string | null;
  status: HydrantStatus;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  updatedBy?: string;
}

export interface HydrantFormData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  photoUrl?: string | null;
  status?: HydrantStatus;
}
