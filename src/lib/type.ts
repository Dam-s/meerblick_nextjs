// la definition des interfaces pour les types de données utilisées dans l'application

export interface Chambre {
  id: number;
  numero: string;
  type_chambre?: string;
  capacite: number;
  vue?: string | null;
  etage?: number | null;
  tarif: number;
  description?: string | null;
  point_par_nuits: number;
  isDisponible?: boolean;
  created_at: string;
  equipements?: string[];
  photos?: string[];
}
