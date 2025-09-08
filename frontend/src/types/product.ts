interface Coordinates{
   x: number;
   y: number;
}

export interface Product {
   id: string;
   name: string;
   unit: string;
   coordinates?: Coordinates;
   created?: string;
}

export interface ProductUpdate {
   id: string;
   name?: string;
   unit?: string;
   coordinates?: Coordinates;
}