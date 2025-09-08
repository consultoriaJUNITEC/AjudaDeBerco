

export interface ProductInCart {
   id: number;
   code: string;
   name: string;
   quantity: number;
   unit: string;
   expirationDate: string;
   description: string;
}

export interface Cart {
   id: string;
   type: "Entrada" | "Saída";
   products: ProductInCart[];
   exportedAt: string;
}
