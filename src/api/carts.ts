import type { Cart } from '../types/carts';
import { API_BASE_URL, CARTS_ENDPOINTS } from '../constants';

/**
 * Creates a new cart in the system
 * @param password Password for authentication (admin or voluntario password)
 * @returns The created cart
 */
export const createCar = async (
  password: string,
  cartType: "Entrada" | "Saída" = "Entrada"
): Promise<Cart> => {
  try {
    const response = await fetch(CARTS_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password,
        type: cartType
      }),
    });
    if (!response.ok) {
      throw new Error(`Error creating cart: ${response.status}`);
    }

    const data = await response.json();
    return {id: data.id_car, type: data.type, products: [], exportedAt: ""}
  } catch (error) {
    console.error('Error creating cart:', error);
    throw error;
  }
};

/**
 * Gets a cart by ID
 * @param id Cart ID
 * @returns Cart data
 */
export const getCart = async (
  id: string
): Promise<Cart> => {
  try {
    const response = await fetch(CARTS_ENDPOINTS.GET_BY_ID(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching cart: ${response.status}`);
    }

    const data = await response.json();
    return {id: data.id_car, type: data.type, products: data.products, exportedAt: ""}
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

export const getAllCarts = async (
  token: string
): Promise<Cart[]> => {
  try {
    const response = await fetch(CARTS_ENDPOINTS.GET_ALL, {
      method: 'GET',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching all carts: ${response.status}`);
    }

    const data = await response.json();
    // Check if there are no carts
    if (data === null || data.length === 0) {
      return [];
    }

    return data.map((cart: any) => ({
      id: cart.id_car,
      type: cart.type,
      products: cart.products || [],
      exportedAt: cart.date_export
    }));
  } catch (error) {
    console.error('Error fetching all carts:', error);
    throw error;
  }
}


/**
 * Adds a product to a cart
 * @param carId Cart ID
 * @param productId Product ID
 * @param quantity Quantity of the product
 * @param expirationDate Product expiration date in ISO 8601 format
 * @returns Updated cart
 */
export const addProductToCart = async (
  carId: string,
  productId: string,
  quantity: number,
  expirationDate: string
): Promise<Cart> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cars/add-product?id=${carId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        expiration_date: expirationDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error adding product: ${response.status}`);
    }

    return await response.json() as Cart;
  } catch (error) {
    console.error('Error adding product to cart:', error);
    throw error;
  }
};

/**
 * Removes a product from a cart
 * @param carId Cart ID
 * @param productId Product ID
 * @param expirationDate Optional expiration date (if provided, removes only products with this date)
 * @returns Updated cart
 */
export const removeProductFromCart = async (
  carId: string, 
  productId: string, 
  expirationDate?: string
): Promise<Cart> => {
  try {
    let url = `${API_BASE_URL}/cars/remove-product?car_id=${carId}&product_id=${productId}`;
    
    if (expirationDate) {
      url += `&expiration_date=${encodeURIComponent(expirationDate)}`;
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error removing product: ${response.status}`);
    }

    return await response.json() as Cart;
  } catch (error) {
    console.error('Error removing product from cart:', error);
    throw error;
  }
};

/**
 * Updates the quantity of a product in a cart
 * @param carId Cart ID
 * @param productId Product ID
 * @param quantity New quantity
 * @param expirationDate Product expiration date
 * @returns Updated cart
 */
export const updateProductQuantity = async (
  carId: string, 
  productId: string, 
  quantity: number,
  expirationDate: string
): Promise<Cart> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cars/update-quantity?car_id=${carId}&product_id=${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity,
        expiration_date: expirationDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error updating quantity: ${response.status}`);
    }

    return await response.json() as Cart;
  } catch (error) {
    console.error('Error updating product quantity:', error);
    throw error;
  }
};
