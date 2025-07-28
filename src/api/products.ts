import type { Product, ProductUpdate } from '../types/product';
import { PRODUCTS_ENDPOINTS } from '../constants';

// Function to get all products
export const getAllProducts = async (): Promise<Product[]> => {
   try {
      const response = await fetch(PRODUCTS_ENDPOINTS.GET_ALL, {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data.map((product: any) => ({
         id: product.id,
         name: product.name,
         unit: product.unit,
         coordinates: {x: product.position_x, y: product.position_y},
         created: product.created_at,
      }));
   }
   catch (error) {
      console.error('Error fetching products:', error);
      throw error;
   }
}

// Function to get a specific product by ID
export const getProductById = async (id: string): Promise<Product> => {
   try {
      const response = await fetch(PRODUCTS_ENDPOINTS.GET_BY_ID(id), {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const product = await response.json();
      return {
         id: product.id,
         name: product.name,
         unit: product.unit,
         coordinates: {x: product.position_x, y: product.position_y},
         created: product.created_at,
      };
   }
   catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
   }
}

// Function to create a new product
export const createProduct = async (product: Product, token: string): Promise<Product> => {
   try {
      const response = await fetch(PRODUCTS_ENDPOINTS.CREATE, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify({
            id: product.id,
            name: product.name,
            unit: product.unit,
          }),
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const createdProduct = await response.json();
      return {
         id: createdProduct.id,
         name: createdProduct.name,
         unit: createdProduct.unit,
         created: createdProduct.created_at,
      };
   }
   catch (error) {
      console.error('Error creating product:', error);
      throw error;
   }
}


// Function to update an existing product
export const updateProduct = async (product: ProductUpdate, token: string): Promise<Product> => {
   try {
      const response = await fetch(PRODUCTS_ENDPOINTS.UPDATE(product.id), {
         method: 'PUT',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify({
            name: product.name,
            unit: product.unit,
            position_x: parseInt(product.coordinates!.x.toString()),
            position_y: parseInt(product.coordinates!.y.toString()),
          }),
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
      const updatedProduct = await response.json();
      return {
         id: updatedProduct.id,
         name: updatedProduct.name,
         unit: updatedProduct.unit,
         created: updatedProduct.created_at,
      };
   }
   catch (error) {
      console.error(`Error updating product with id ${product.id}:`, error);
      throw error;
   }
}

// Function to delete a product
export const deleteProduct = async (id: string, token: string): Promise<void> => {
   try {
      const response = await fetch(PRODUCTS_ENDPOINTS.DELETE(id), {
         method: 'DELETE',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
      });
      if (!response.ok) {
         throw new Error('Network response was not ok');
      }
   }
   catch (error) {
      console.error(`Error deleting product with id ${id}:`, error);
      throw error;
   }
}

// Function to search for products by name or id
// Returns a promise that resolves to an array of products
export const searchProducts = async (query: string): Promise<Product[]> => {
   try {
      const byIdResponse = await fetch(PRODUCTS_ENDPOINTS.SEARCH_BY_ID(query), {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!byIdResponse.ok) {
         throw new Error('Network response was not ok');
      }
      const byIdData = await byIdResponse.json();
      const byIdProducts = byIdData.results.map((product: any) => ({
         id: product.id,
         name: product.name,
         unit: product.unit,
         created: product.created_at,
      }));

      const byNameResponse = await fetch(PRODUCTS_ENDPOINTS.SEARCH_BY_NAME(query), {
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
         },
      });
      if (!byNameResponse.ok) {
         throw new Error('Network response was not ok');
      }
      const byNameData = await byNameResponse.json();
      const byNameProducts = byNameData.results.map((product: any) => ({
         id: product.id,
         name: product.name,
         unit: product.unit,
         created: product.created_at,
      }));

      // Combine the results from both searches and remove duplicates
      const productsMap = new Map<string | number, Product>();
      [...byIdProducts, ...byNameProducts].forEach(product => {
         productsMap.set(product.id, product);
      });
      
      // Convert back to array
      return Array.from(productsMap.values());
   }
   catch (error) {
      console.error('Error searching for products:', error);
      throw error;
   }
}
