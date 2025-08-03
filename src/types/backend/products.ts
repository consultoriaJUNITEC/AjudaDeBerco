export interface Product {
  id: string;
  name: string;
  normalized_name: string;
  unit: string;
  position_x: number;
  position_y: number;
  created_at: Date;
}

export interface CreateProductRequest {
  name: string;
  unit: string;
  position_x?: number;
  position_y?: number;
}

export interface UpdateProductRequest {
  name?: string;
  unit?: string;
  position_x?: number;
  position_y?: number;
}
