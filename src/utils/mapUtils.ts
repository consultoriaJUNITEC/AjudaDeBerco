import type { Product } from '../types/product';

/**
 * Normalizes text by removing accents and converting to lowercase
 */
export const normalizeText = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

/**
 * Filters products based on search term (name or ID)
 */
export const filterProducts = (products: Product[], searchTerm: string): Product[] => {
  if (searchTerm.trim() === "") {
    return products;
  }

  const normalizedSearch = normalizeText(searchTerm);
  return products.filter(
    product =>
      normalizeText(product.name).includes(normalizedSearch) ||
      normalizeText(product.id).includes(normalizedSearch)
  );
};

/**
 * Formats product name for display on map markers
 */
export const formatProductNameForMarker = (name: string): { first: string; second: string } => {
  const words = name.split(' ');
  const firstWord = words[0] || '';
  const secondWord = words[1] || '';

  return {
    first: firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase(),
    second: secondWord.charAt(0).toUpperCase() + secondWord.slice(1).toLowerCase(),
  };
};

/**
 * Checks if a product has valid coordinates
 */
export const hasValidCoordinates = (product: Product): boolean => {
  return !!(product.coordinates && product.coordinates.x !== 0 && product.coordinates.y !== 0);
};

/**
 * Gets products without valid coordinates
 */
export const getUnmappedProducts = (products: Product[]): Product[] => {
  return products.filter(product => !hasValidCoordinates(product));
};

/**
 * Calculates distance between a point and product coordinates
 */
export const calculateDistance = (
  x: number, 
  y: number, 
  product: Product
): number => {
  if (!hasValidCoordinates(product)) return Infinity;
  
  const dx = x - product.coordinates!.x;
  const dy = y - product.coordinates!.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Converts client coordinates to canvas coordinates
 */
export const clientToCanvasCoordinates = (
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width * canvas.width;
  const y = (clientY - rect.top) / rect.height * canvas.height;
  
  return { x, y };
};
