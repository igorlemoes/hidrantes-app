"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { getHydrants, saveHydrant, updateHydrantStatus, deleteHydrant, uploadPhoto } from "@/lib/supabase-actions";
import { Hydrant, HydrantStatus } from "@/types/hydrant";
import { Map } from "@/components/map";
import { FormActions } from "@/components/form-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LogOut,
  RefreshCw,
  List,
  LogIn,
  HelpCircle,
  MapPin,
  User,
  Droplets,
  X,
  Camera,
  FileText,
  Home,
  Check,
  Trash2,
  Wrench,
  Navigation,
  Navigation2,
  Pencil,
  Download,
  Star,
  AlertTriangle,
} from "lucide-react";

export function Dashboard() {
  const [hydrants, setHydrants] = useState<Hydrant[]>([]);
  const [selectedHydrant, setSelectedHydrant] = useState<Hydrant | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCity, setReportCity] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("📍 Obtendo localização...");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [isAddingHydrant, setIsAddingHydrant] = useState(false);
  const [editingHydrant, setEditingHydrant] = useState<Hydrant | null>(null);

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    photoUrl: null as string | null,
    photoFile: null as File | null,
  });

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();
  }, []);

  const loadHydrants = useCallback(async () => {
    try {
      const data = await getHydrants();
      setHydrants(data);
    } catch (error: any) {
      console.error("Erro ao carregar hidrantes:", error);
      toast.error(error?.message || "Erro ao carregar hidrantes");
    }
  }, []);

  useEffect(() => {
    loadHydrants();
  }, [loadHydrants]);

  const reverseGeocode = async (lat: number, lon: number): Promise<{address: string | null; city: string | null}> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "HidrantesApp/1.0",
          },
        }
      );
      const data = await response.json();
      if (data.address) {
        const { road, street, avenue, number, neighbourhood, suburb, city, town, village } = data.address;
        const addressParts = [];
        if (road || street || avenue) {
          addressParts.push(road || street || avenue);
          if (number) addressParts.push(", " + number);
        }
        if (neighbourhood || suburb) {
          addressParts.push(" - " + (neighbourhood || suburb));
        }
        const cityName = city || town || village || null;
        const address = addressParts.length > 0 ? addressParts.join("") : null;
        return { address, city: cityName };
      }
      return { address: null, city: null };
    } catch (error) {
      console.warn("Erro no geocoding reverso:", error);
      return { address: null, city: null };
    }
  };

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("❌ GPS não suportado");
      setLoading(false);
      return;
    }

    setLocationStatus("📍 Obtendo localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus(
          `📍 ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        );
        setLoading(false);
      },
      (error) => {
        console.warn("Erro GPS:", error.code, error.message);
        let msg = "⚠️ GPS indisponível";
        if (error.code === 1) {
          msg = "⚠️ Permissão negada. Clique para permitir.";
        } else if (error.code === 2) {
          msg = "⚠️ GPS não encontrou sua posição";
        } else if (error.code === 3) {
          msg = "⚠️ GPS demorou demais";
        }
        setLocationStatus(msg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getStatusColor = (status: HydrantStatus) => {
    switch (status) {
      case "otimo":
        return "bg-emerald-500 hover:bg-emerald-600";
      case "bom":
        return "bg-green-500 hover:bg-green-600";
      case "regular":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "pessimo":
        return "bg-orange-500 hover:bg-orange-600";
      case "inativo":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-green-500 hover:bg-green-600";
    }
  };

  const getStatusBgColor = (status: HydrantStatus) => {
    switch (status) {
      case "otimo":
        return "bg-emerald-500 text-white";
      case "bom":
        return "bg-green-500 text-white";
      case "regular":
        return "bg-yellow-500 text-white";
      case "pessimo":
        return "bg-orange-500 text-white";
      case "inativo":
        return "bg-red-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const getStatusDotColor = (status: HydrantStatus) => {
    switch (status) {
      case "otimo":
        return "bg-emerald-500";
      case "bom":
        return "bg-green-500";
      case "regular":
        return "bg-yellow-500";
      case "pessimo":
        return "bg-orange-500";
      case "inativo":
        return "bg-red-500";
      default:
        return "bg-green-500";
    }
  };

  const getStatusIcon = (status: HydrantStatus) => {
    switch (status) {
      case "otimo":
        return <Star className="w-3 h-3" />;
      case "bom":
        return <Check className="w-3 h-3" />;
      case "regular":
        return <Wrench className="w-3 h-3" />;
      case "pessimo":
        return <AlertTriangle className="w-3 h-3" />;
      case "inativo":
        return <X className="w-3 h-3" />;
      default:
        return <Check className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: HydrantStatus) => {
    switch (status) {
      case "otimo":
        return "Ótimo";
      case "bom":
        return "Bom";
      case "regular":
        return "Regular";
      case "pessimo":
        return "Péssimo";
      case "inativo":
        return "Inativo";
      default:
        return "Bom";
    }
  };

  const [newStatus, setNewStatus] = useState<HydrantStatus>("bom");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortedHydrants = useMemo(() => {
    if (!currentLocation) return [...hydrants];

    return [...hydrants].sort((a, b) => {
      const distA = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }, [hydrants, currentLocation]);

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          photoUrl: event.target?.result as string,
          photoFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startAddingHydrant = () => {
    if (!user) {
      toast.error("Faça login para adicionar hidrantes");
      return;
    }
    if (!currentLocation) {
      toast.error("Aguarde a localização");
      return;
    }
    setSelectedLocation(currentLocation);
    setFormData({ address: "", city: "", photoUrl: null, photoFile: null });
    setNewStatus("bom");
    setIsAddingHydrant(true);
  };

  const openForm = async () => {
    if (!selectedLocation) {
      toast.error("Clique no mapa para posicionar o hidrante");
      return;
    }
    setNewStatus("bom");
    
    const { address, city } = await reverseGeocode(selectedLocation.latitude, selectedLocation.longitude);
    setFormData({ address: address || "", city: city || "", photoUrl: null, photoFile: null });
    
    setShowForm(true);
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ latitude: lat, longitude: lng });
    
    const { address, city } = await reverseGeocode(lat, lng);
    setFormData((prev) => ({ ...prev, address: address || prev.address, city: city || prev.city }));
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
    }
  };

  const openEditModal = () => {
    if (!selectedHydrant) return;
    setSelectedHydrant(null);
    setEditingHydrant(selectedHydrant);
    setFormData({
      address: selectedHydrant.address || "",
      city: (selectedHydrant as any).city || "",
      photoUrl: selectedHydrant.photoUrl,
      photoFile: null,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingHydrant(null);
    setFormData({ address: "", city: "", photoUrl: null, photoFile: null });
  };

  const handleSaveEdit = async () => {
    if (!user || !editingHydrant) {
      toast.error("Erro ao salvar");
      return;
    }

    const loadingToast = toast.loading("Salvando...");
    let photoUrl = editingHydrant.photoUrl;

    if (formData.photoFile) {
      setSavingPhoto(true);
      try {
        photoUrl = await uploadPhoto(formData.photoFile, editingHydrant.id, editingHydrant.photoUrl);
      } catch (error: any) {
        console.warn("Erro ao fazer upload da foto:", error?.message);
        toast.warning("Foto não enviada, mantendo foto anterior");
      }
      setSavingPhoto(false);
    }

    try {
      await saveHydrant({
        latitude: editingHydrant.latitude,
        longitude: editingHydrant.longitude,
        address: formData.address || undefined,
        city: formData.city || undefined,
        photoUrl,
        status: editingHydrant.status,
      }, editingHydrant.id);

      await loadHydrants();
      setSelectedHydrant((prev) => prev ? {
        ...prev,
        address: formData.address || null,
        city: formData.city || null,
        photoUrl,
      } : null);
      closeEditModal();
      toast.success("Hidrante atualizado!");
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      toast.error("Erro ao salvar hidrante");
    }
    toast.dismiss(loadingToast);
  };

  const handleChangeStatusFromEdit = async (status: HydrantStatus) => {
    if (!editingHydrant) return;
    setEditingHydrant((prev) => prev ? { ...prev, status } : null);
  };

  const handleSaveHydrant = async () => {
    if (!user) {
      toast.error("Faça login para adicionar hidrantes");
      return;
    }
    
    if (!selectedLocation) {
      toast.error("Selecione uma localização no mapa");
      return;
    }

    const loadingToast = toast.loading("Salvando...");

    let photoUrl: string | null = null;
    const hydrantId = `h_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (formData.photoFile) {
      setSavingPhoto(true);
      try {
        photoUrl = await uploadPhoto(formData.photoFile, hydrantId);
      } catch (error: any) {
        console.warn("Erro ao fazer upload da foto, salvando sem foto:", error?.message);
        toast.warning("Foto não enviada, salvando sem foto");
      }
      setSavingPhoto(false);
    }

    try {
      await saveHydrant({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: formData.address || undefined,
        city: formData.city || undefined,
        photoUrl,
        status: newStatus,
      });

      await loadHydrants();
      setShowForm(false);
      setIsAddingHydrant(false);
      setSelectedLocation(null);
      toast.success("Hidrante registrado!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar hidrante");
    }
    toast.dismiss(loadingToast);
  };

  const handleChangeStatus = async (status: HydrantStatus) => {
    if (!user) {
      toast.error("Faça login para alterar status");
      return;
    }
    if (!selectedHydrant) return;

    try {
      await updateHydrantStatus(selectedHydrant.id, status);
      await loadHydrants();
      setSelectedHydrant((prev) => (prev ? { ...prev, status } : null));
      setShowStatusModal(false);
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteHydrant = async () => {
    if (!user) {
      toast.error("Faça login para excluir hidrantes");
      return;
    }
    if (!selectedHydrant) return;

    if (!confirm("Excluir este hidrante?")) return;

    try {
      await deleteHydrant(selectedHydrant.id, selectedHydrant.photoUrl);
      await loadHydrants();
      setSelectedHydrant(null);
      toast.success("Hidrante excluído!");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir hidrante");
    }
  };

  const drawRoute = () => {
    if (!selectedHydrant || !currentLocation) {
      toast.error("Localização atual não disponível");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${selectedHydrant.latitude},${selectedHydrant.longitude}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const generateReport = () => {
    setShowReportModal(true);
  };

  const downloadReport = () => {
    const currentYear = new Date().getFullYear();
    const headers = ["Cidade", "Endereço", "Status", "Data da revisão", "E-mail do operador"];
    
    const filteredHydrants = reportCity 
      ? hydrants.filter((h) => h.city === reportCity)
      : hydrants;
    
    const rows = filteredHydrants.map((h) => [
      h.city || "",
      h.address || "",
      getStatusText(h.status),
      formatDate(h.updatedAt),
      h.updatedBy || "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Planilha de Hidrantes ${currentYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowReportModal(false);
    toast.success("Planilha gerada com sucesso!");
  };

  const uniqueCities = useMemo(() => {
    const cities = new Set(hydrants.map((h) => h.city).filter((c): c is string => Boolean(c)));
    return Array.from(cities).sort();
  }, [hydrants]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      {/* Header */}
      <header 
        className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0" 
        style={{ paddingTop: `max(env(safe-area-inset-top), 0.75rem)` }}
      >
        <div className="flex items-center gap-3">
          <Droplets className="w-6 h-6 text-[#54c0eb]" />
          <h1 className="font-semibold text-lg text-[#ff5959]">Hidrantes</h1>
          <Badge variant="secondary">{hydrants.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <HelpCircle className="w-5 h-5" />
                </Button>
              }
            />
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Ajuda
                </h4>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p><strong>Permissão de Localização:</strong></p>
                  <p>iOS: Ajustes {">"} Privacidade {">"} Serviços de Localização {">"} Safari/Chrome</p>
                  <p>Android: Configurações {">"} Apps {">"} Chrome {">"} Permissões</p>
                  <p className="mt-2">Após permitir, clique em "Tentar novamente" para ver sua posição no mapa.</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline max-w-32 truncate">
                <User className="w-4 h-4 inline mr-1" />
                {user.email}
              </span>
              <Button variant="outline" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
              <LogIn className="w-4 h-4 mr-1" />
              Login
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => loadHydrants()} title="Atualizar">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDrawerOpen(!drawerOpen)} title="Lista">
            <List className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Location Bar */}
        <div className="absolute top-3 left-3 right-3 z-50 bg-card/95 backdrop-blur border rounded-lg shadow-sm px-4 py-2 flex items-center justify-between">
          <span 
            className={cn(
              "text-sm font-medium cursor-pointer",
              locationStatus.includes("Clique") && "text-amber-600"
            )}
            onClick={() => !currentLocation && requestLocation()}
            title={!currentLocation ? "Clique para tentar novamente" : ""}
          >
            {isAddingHydrant ? (
              <span className="text-primary animate-pulse flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Clique no mapa para posicionar
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {locationStatus}
              </span>
            )}
          </span>
          {user && (
            <>
              {isAddingHydrant ? (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsAddingHydrant(false);
                      setSelectedLocation(null);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={openForm}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Confirmar
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  onClick={startAddingHydrant} 
                  disabled={!currentLocation}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </>
          )}
        </div>

        {/* Map Container */}
        <div className="absolute top-14 left-0 right-0 bottom-0 z-0">
          {!currentLocation ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-pulse rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-muted-foreground">Obtendo localização...</p>
                  </>
                ) : (
                  <>
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Localização não disponível</p>
                    <Button variant="outline" size="sm" onClick={requestLocation}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Tentar novamente
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Map
              hydrants={hydrants}
              currentLocation={currentLocation}
              selectedHydrant={selectedHydrant}
              selectedLocation={selectedLocation}
              onSelectHydrant={(id) =>
                setSelectedHydrant(hydrants.find((h) => h.id === id) || null)
              }
              onLocationSelect={handleLocationSelect}
              isAddingHydrant={isAddingHydrant}
            />
          )}
        </div>

        {/* Selected Hydrant Card */}
        {selectedHydrant && (
          <Dialog open={!!selectedHydrant} onOpenChange={(open) => !open && setSelectedHydrant(null)}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" showCloseButton={false}>
              <div className="flex justify-between items-center">
                <Droplets className="w-8 h-8 text-[#54c0eb]" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2"
                  onClick={() => setSelectedHydrant(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-white px-3 py-1", getStatusColor(selectedHydrant.status))}>
                    {getStatusText(selectedHydrant.status)}
                  </Badge>
                  {currentLocation && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {Math.round(
                        calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          selectedHydrant.latitude,
                          selectedHydrant.longitude
                        )
                      )}{" "}
                     m
                    </span>
                  )}
                </div>

                {selectedHydrant.photoUrl && (
                  <img
                    src={selectedHydrant.photoUrl}
                    alt="Foto do hidrante"
                    className="w-full rounded-lg"
                  />
                )}

                {(selectedHydrant.address || selectedHydrant.city) && (
                  <p className="text-sm text-muted-foreground">
                    {selectedHydrant.address}
                    {selectedHydrant.address && selectedHydrant.city && " - "}
                    {selectedHydrant.city}
                  </p>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Atualizado: {formatDate(selectedHydrant.updatedAt)}
                </p>
                {selectedHydrant.updatedBy && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Por: {selectedHydrant.updatedBy}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button size="lg" onClick={drawRoute} className="flex-1">
                  <Navigation2 className="w-4 h-4 mr-1" />
                  Abrir Rota
                </Button>
                {user && (
                  <>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={openEditModal}
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleDeleteHydrant}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Drawer Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 z-[100] transition-opacity duration-200",
            drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer */}
        <div
          className={cn(
            "fixed top-0 right-0 h-full w-80 bg-background border-l shadow-xl z-[100] transition-transform duration-300 pt-[env(safe-area-inset-top)]",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#54c0eb]" />
              Hidrantes ({hydrants.length})
            </h2>
            <div className="flex gap-1">
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateReport}
                  title="Baixar Planilha"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Planilha
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-65px)] pb-[env(safe-area-inset-bottom)]">
            {hydrants.length === 0 ? (
              <div className="p-8 text-center">
                <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum hidrante registrado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Adicionar" para registrar
                </p>
              </div>
            ) : (
              sortedHydrants.map((hydrant) => {
                const distance = currentLocation
                  ? Math.round(
                      calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        hydrant.latitude,
                        hydrant.longitude
                      )
                    )
                  : null;

                return (
                  <div
                    key={hydrant.id}
                    className={cn(
                      "p-3 border-b cursor-pointer transition-colors",
                      selectedHydrant?.id === hydrant.id
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setSelectedHydrant(hydrant);
                      setDrawerOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full shrink-0",
                          hydrant.status === "otimo"
                            ? "bg-emerald-500"
                            : hydrant.status === "bom"
                            ? "bg-green-500"
                            : hydrant.status === "regular"
                            ? "bg-yellow-500"
                            : hydrant.status === "pessimo"
                            ? "bg-orange-500"
                            : "bg-red-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {hydrant.address || "Hidrante"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className={cn(
                            hydrant.status === "otimo"
                              ? "text-emerald-600"
                              : hydrant.status === "bom"
                              ? "text-green-600"
                              : hydrant.status === "regular"
                              ? "text-yellow-600"
                              : hydrant.status === "pessimo"
                              ? "text-orange-600"
                              : "text-red-600"
                          )}>
                            {getStatusText(hydrant.status)}
                          </span>
                          {hydrant.latitude.toFixed(4)},{" "}
                          {hydrant.longitude.toFixed(4)}
                          {distance !== null && ` • ${distance}m`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Hydrant Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#54c0eb]" />
              Registrar Hidrante
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="relative">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <label className="absolute bottom-3 right-3 cursor-pointer bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus("otimo")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    newStatus === "otimo"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Star className="w-4 h-4" />
                  Ótimo
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus("bom")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    newStatus === "bom"
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Check className="w-4 h-4" />
                  Bom
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus("regular")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    newStatus === "regular"
                      ? "bg-yellow-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Wrench className="w-4 h-4" />
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus("pessimo")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    newStatus === "pessimo"
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Péssimo
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewStatus("inativo")}
                className={cn(
                  "w-full h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                  newStatus === "inativo"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <X className="w-4 h-4" />
                Inativo
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                Endereço
              </Label>
              <Input
                id="address"
                placeholder="Rua, número..."
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Cidade
              </Label>
              <Input
                id="city"
                placeholder="Cidade"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 pb-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowForm(false);
                setIsAddingHydrant(false);
                setSelectedLocation(null);
                setNewStatus("bom");
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveHydrant}
              disabled={savingPhoto}
            >
              {savingPhoto ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Registrar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-sm pb-[env(safe-area-inset-bottom)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Alterar Status
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeStatus("otimo")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    selectedHydrant?.status === "otimo"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20">
                    <Star className="w-3 h-3" />
                  </span>
                  Ótimo
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatus("bom")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    selectedHydrant?.status === "bom"
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20">
                    <Check className="w-3 h-3" />
                  </span>
                  Bom
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeStatus("regular")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    selectedHydrant?.status === "regular"
                      ? "bg-yellow-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20">
                    <Wrench className="w-3 h-3" />
                  </span>
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatus("pessimo")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    selectedHydrant?.status === "pessimo"
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                  Péssimo
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleChangeStatus("inativo")}
                className={cn(
                  "w-full h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                  selectedHydrant?.status === "inativo"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20">
                  <X className="w-3 h-3" />
                </span>
                Inativo
              </button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowStatusModal(false)}
            >
              <X className="w-4 h-4 mr-1" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Hydrant Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Editar Hidrante
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {/* Photo */}
            <div className="relative">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <label className="absolute bottom-3 right-3 cursor-pointer bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeStatusFromEdit("otimo")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    editingHydrant?.status === "otimo"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Star className="w-4 h-4" />
                  Ótimo
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatusFromEdit("bom")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    editingHydrant?.status === "bom"
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Check className="w-4 h-4" />
                  Bom
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeStatusFromEdit("regular")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    editingHydrant?.status === "regular"
                      ? "bg-yellow-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Wrench className="w-4 h-4" />
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeStatusFromEdit("pessimo")}
                  className={cn(
                    "flex-1 h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    editingHydrant?.status === "pessimo"
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Péssimo
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleChangeStatusFromEdit("inativo")}
                className={cn(
                  "w-full h-9 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                  editingHydrant?.status === "inativo"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <X className="w-4 h-4" />
                Inativo
              </button>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                Endereço
              </Label>
              <Input
                id="edit-address"
                placeholder="Rua, número..."
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="edit-city" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Cidade
              </Label>
              <Input
                id="edit-city"
                placeholder="Cidade"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 pb-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeEditModal}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveEdit}
              disabled={savingPhoto}
            >
              {savingPhoto ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report City Filter Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Gerar Planilha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-city" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Filtrar por Cidade
              </Label>
              <select
                id="report-city"
                value={reportCity}
                onChange={(e) => setReportCity(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Todas as cidades</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowReportModal(false)}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button className="flex-1" onClick={downloadReport}>
                <Download className="w-4 h-4 mr-1" />
                Baixar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
