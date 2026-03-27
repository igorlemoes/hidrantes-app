"use client";

import { getSupabase } from "@/lib/supabase";
import { Hydrant, HydrantFormData } from "@/types/hydrant";

const STORAGE_BUCKET = "hidrantes-photos";

function mapToHydrant(h: any): Hydrant {
  return {
    id: h.id,
    latitude: h.latitude,
    longitude: h.longitude,
    address: h.address || null,
    city: h.city || null,
    photoUrl: h.photo_url || null,
    status: (h.status as Hydrant["status"]) || "active",
    createdAt: h.created_at,
    updatedAt: h.updated_at,
    updatedBy: h.updated_by || null,
  };
}

export async function getHydrants(): Promise<Hydrant[]> {
  const supabase = getSupabase();
  const { data, error } = await (supabase as any)
    .from("hidrantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getHydrants error:", error);
    throw error;
  }
  
  return (data || []).map(mapToHydrant);
}

export async function saveHydrant(formData: HydrantFormData, existingId?: string): Promise<Hydrant> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email || null;

  const insertData = {
    latitude: formData.latitude,
    longitude: formData.longitude,
    address: formData.address || null,
    city: formData.city || null,
    photo_url: formData.photoUrl || null,
    status: formData.status || "active",
    created_at: now,
    updated_at: now,
    updated_by: userEmail,
  };

  if (existingId) {
    const { data, error } = await (supabase as any)
      .from("hidrantes")
      .update({ ...insertData, updated_at: now })
      .eq("id", existingId)
      .select()
      .single();

    if (error) {
      console.error("saveHydrant update error:", error);
      throw error;
    }
    
    return mapToHydrant(data);
  }

  const id = `h_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await (supabase as any)
    .from("hidrantes")
    .insert({ ...insertData, id })
    .select()
    .single();

  if (error) {
    console.error("saveHydrant insert error:", error);
    throw error;
  }

  return mapToHydrant(data);
}

export async function updateHydrantStatus(hydrantId: string, status: string): Promise<Hydrant> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email || null;

  const { data, error } = await (supabase as any)
    .from("hidrantes")
    .update({
      status,
      updated_at: new Date().toISOString(),
      updated_by: userEmail,
    })
    .eq("id", hydrantId)
    .select()
    .single();

  if (error) {
    console.error("updateHydrantStatus error:", error);
    throw error;
  }

  return mapToHydrant(data);
}

export async function deleteHydrant(hydrantId: string, photoUrl?: string | null): Promise<void> {
  const supabase = getSupabase();
  
  if (photoUrl) {
    const fileName = photoUrl.split("/").pop();
    if (fileName) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([`photos/${fileName}`]);
      } catch (err) {
        console.warn("Erro ao deletar foto do storage:", err);
      }
    }
  }

  const { error } = await (supabase as any)
    .from("hidrantes")
    .delete()
    .eq("id", hydrantId);

  if (error) {
    console.error("deleteHydrant error:", error);
    throw error;
  }
}

export async function uploadPhoto(file: File, hydrantId: string, existingPhotoUrl?: string | null): Promise<string> {
  const supabase = getSupabase();
  
  if (existingPhotoUrl) {
    const fileName = existingPhotoUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from(STORAGE_BUCKET).remove([`photos/${fileName}`]);
    }
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const fileName = `${hydrantId}_${timestamp}.${fileExt}`;

  const { data, error } = await (supabase as any).storage
    .from(STORAGE_BUCKET)
    .upload(`photos/${fileName}`, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("uploadPhoto error:", error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(`photos/${fileName}`);

  return urlData.publicUrl;
}
