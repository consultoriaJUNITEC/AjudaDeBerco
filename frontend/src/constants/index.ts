/**
 * Global Constants for the Application
 */



/**
 * Base URLs
 */
export const API_BASE_URL = 'https://ajudadeberco-157158522558.europe-west1.run.app'
export const WEBSOCKET_URL = 'wss://ajudadeberco-157158522558.europe-west1.run.app';


/**
 * Units of Measurement for Products
 */
export const PRODUCT_UNITS = [
  'UNI', 
  'UNID.',
  'CX',
  'EMB.',
  'EMB',
  'PC',
  'LT',
];

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = {
  'ALIMENTAÇÃO': 'GA',
  'ESCRITÓRIO': 'MTMT',
  'PUERICULTURA': 'PCPC',
  'HIGIENE': 'PHPH',
  'LIMPEZA': 'PL',
  'COZINHA': 'PZMC',
  'VÁRIOS': 'VAVA'
} as const;

/**
 * Cart Types
 */
export const CART_TYPES = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída'
} as const;

/**
 * Auth Endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  VERIFY: `${API_BASE_URL}/login`,
};

/**
 * Products Endpoints
 */
export const PRODUCTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/products`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/products/${id}`,
  CREATE: `${API_BASE_URL}/products`,
  UPDATE: (id: string) => `${API_BASE_URL}/products/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/products/${id}`,
  SEARCH_BY_NAME: (name: string) => `${API_BASE_URL}/search/products?name=${name}`,
  SEARCH_BY_ID: (id: string) => `${API_BASE_URL}/search/products?id=${id}`,
};

/**
 * Donors Endpoints
 */
export const DONORS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/donors`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/donors/${id}`,
  CREATE: `${API_BASE_URL}/donors`,
  UPDATE: (id: string) => `${API_BASE_URL}/donors/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/donors/${id}`,
  SEARCH_BY_NAME: (name: string) => `${API_BASE_URL}/search/donors?name=${name}`,
  SEARCH_BY_ID: (id: string) => `${API_BASE_URL}/search/donors?id=${id}`,
};

/**
 * Carts Endpoints
 */
export const CARTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/cars`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/cars/get?id=${id}`,
  CREATE: `${API_BASE_URL}/cars/create`,
};

/**
 * WebSocket Actions
 */
export const WS_ACTIONS = {
  GET_CAR: 'GetCar',
  ADD_PRODUCT_CAR: 'AddProductCar',
  DELETE_PRODUCT_CAR: 'DeleteProductCar',
  DELETE_CAR: 'DeleteCar',
  EXPORT: 'Export',
  UPDATE_CAR: 'UpdateCar',
};

/**
 * WebSocket Functions
 */
export const WEBSOCKET_ENDPOINTS = {
  CONNECT: (carId: string) => `${WEBSOCKET_URL}/ws?id_car=${carId}`,
};

/**
 * Assets/Media URLs
 */
export const ASSETS = {
  MAP_PATH: `${API_BASE_URL}/assets/mapa.png`,
  LOGO: '/imgs/LogoAjudaDeBerço.png',
  ICON: '/imgs/Icon.png',
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  AUTH_ROLE: 'authRole',
  CURRENT_CART: 'currentCart',
};

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  ISO_8601: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DATE_DISPLAY: 'DD/MM/YYYY',
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm',
};
