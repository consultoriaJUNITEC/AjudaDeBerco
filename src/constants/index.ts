/**
 * Global Constants for the Application
 */



/**
 * Base URLs
 */
export const API_BASE_URL = '/api'
export const WEBSOCKET_URL = 'ws://localhost:3000';


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
  LOGIN: `${API_BASE_URL}/auth/login`,
  VERIFY: `${API_BASE_URL}/auth/verify`,
};

/**
 * Products Endpoints
 */
export const PRODUCTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/products`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/products/${id}`,
  CREATE: `${API_BASE_URL}/products/create`,
  UPDATE: (id: string) => `${API_BASE_URL}/products/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/products/${id}`,
  SEARCH_BY_NAME: (name: string) => `${API_BASE_URL}/search?q=${name}&type=products`,
  SEARCH_BY_ID: (id: string) => `${API_BASE_URL}/search?q=${id}&type=products`,
};

/**
 * Donors Endpoints
 */
export const DONORS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/donors`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/donors/${id}`,
  CREATE: `${API_BASE_URL}/donors/create`,
  UPDATE: (id: string) => `${API_BASE_URL}/donors/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/donors/${id}`,
  SEARCH_BY_NAME: (name: string) => `${API_BASE_URL}/search?q=${name}&type=donors`,
  SEARCH_BY_ID: (id: string) => `${API_BASE_URL}/search?q=${id}&type=donors`,
};

/**
 * Carts Endpoints
 */
export const CARTS_ENDPOINTS = {
  GET_ALL: `${API_BASE_URL}/cars`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/cars/get?id=${id}`,
  CREATE: `${API_BASE_URL}/cars/create`,
  ADD_PRODUCT: `${API_BASE_URL}/cars/add-product`,
  REMOVE_PRODUCT: `${API_BASE_URL}/cars/remove-product`,
  UPDATE_QUANTITY: `${API_BASE_URL}/cars/update-quantity`,
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
