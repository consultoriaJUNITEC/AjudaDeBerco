export interface ProductInCar {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiration_date: Date;
}

export interface Car {
  id: string;
  type: 'Entrada' | 'Saída';
  products: { [productId: string]: ProductInCar[] };
  created_at: Date;
  date_export?: string;
}

export interface CreateCarRequest {
  password: string;
  type: 'Entrada' | 'Saída';
}

export interface AddProductRequest {
  product_id: string;
  quantity: number;
  expiration_date: Date;
}

export interface UpdateProductQuantityRequest {
  product_id: string;
  quantity: number;
  expiration_date: Date;
}

export interface RemoveProductRequest {
  product_id: string;
  expiration_date: Date;
}
