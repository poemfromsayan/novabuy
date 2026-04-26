/**
 * Tipos que modelan la respuesta de DummyJSON API.
 * Cada tipo refleja exactamente la estructura de la API
 * para garantizar type-safety end-to-end.
 */

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

/** Respuesta paginada de la API */
export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
