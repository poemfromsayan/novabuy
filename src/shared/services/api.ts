/**
 * Servicio centralizado para comunicación con DummyJSON API.
 *
 * ¿Por qué un servicio separado?
 * 1. Single Responsibility: los componentes no conocen la URL ni la estructura de la API
 * 2. Facilita testing: podemos mockear este módulo
 * 3. Cambio de API: si mañana cambias de DummyJSON a otra API, solo modificas este archivo
 */

import type { Product, ProductCategory, ProductsResponse } from '../types/product';

const BASE_URL = 'https://dummyjson.com';

/**
 * Wrapper para fetch con manejo de errores centralizado.
 * Lanza un error descriptivo si la respuesta no es ok.
 */
async function fetchJSON<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `API Error: ${response.status} ${response.statusText} — ${endpoint}`
    );
  }

  return response.json() as Promise<T>;
}

/** Obtener productos con paginación y ordenamiento */
export async function getProducts(params?: {
  limit?: number;
  skip?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.skip) searchParams.set('skip', String(params.skip));
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.order) searchParams.set('order', params.order);

  const query = searchParams.toString();
  return fetchJSON<ProductsResponse>(`/products${query ? `?${query}` : ''}`);
}

/** Obtener un producto por ID */
export async function getProductById(id: number): Promise<Product> {
  return fetchJSON<Product>(`/products/${id}`);
}

/** Buscar productos por texto */
export async function searchProducts(query: string): Promise<ProductsResponse> {
  return fetchJSON<ProductsResponse>(
    `/products/search?q=${encodeURIComponent(query)}`
  );
}

/** Obtener productos por categoría */
export async function getProductsByCategory(
  category: string
): Promise<ProductsResponse> {
  return fetchJSON<ProductsResponse>(`/products/category/${category}`);
}

/** Obtener todas las categorías */
export async function getCategories(): Promise<ProductCategory[]> {
  return fetchJSON<ProductCategory[]>('/products/categories');
}
