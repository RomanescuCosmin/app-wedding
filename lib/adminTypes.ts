// Tipuri partajate pentru zona de administrare (galeria mirilor — Stage 4).

/** Un element din galeria admin, așa cum vine de la GET /api/admin/list. */
export interface MediaItem {
  id: string;
  path: string;
  kind: "image" | "video";
  size: number;
  original_name: string;
  created_at: string;
  /** Signed download URL (valabil ~1h). Poate fi `null` dacă semnarea a eșuat. */
  url: string | null;
}

/** Răspunsul de la GET /api/admin/list. */
export interface ListResponse {
  items: MediaItem[];
}
