/**
 * ProductPage — Página de detalle de producto.
 *
 * Funcionalidades:
 * - Galería de imágenes con navegación prev/next + thumbnails
 * - Info del producto: categoría, título, rating, precio con descuento
 * - Grid de detalles (marca, peso, garantía, envío, devolución, SKU)
 * - Selector de cantidad + botones "Agregar al carrito" y "Comprar ahora"
 * - Indicador de stock (en stock / pocas unidades / agotado)
 * - Sección de reviews con avatares y fechas
 * - Productos relacionados por categoría
 * - Toast de confirmación al agregar al carrito
 *
 * ¿Por qué usar useParams + fetch individual?
 * Cada producto se carga por su ID desde la URL (/product/:id).
 * Aunque podríamos cachear los datos del catálogo, el detalle
 * incluye campos extra (reviews, dimensiones) que vale la pena
 * obtener fresh desde la API.
 */

import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getProductById, getProductsByCategory } from '../../shared/services/api';
import { useCart } from '../../shared/context/CartContext';
import ProductCard from '../../shared/components/ProductCard/ProductCard';
import type { Product } from '../../shared/types/product';
import './ProductPage.css';

/** Genera estrellas visuales a partir del rating numérico */
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/** Determina el estado de stock */
function getStockStatus(stock: number) {
  if (stock > 20) return { className: 'stock-in', text: `En stock (${stock} disponibles)` };
  if (stock > 0) return { className: 'stock-low', text: `Quedan pocas unidades (${stock})` };
  return { className: 'stock-out', text: 'Agotado' };
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // ===== STATE =====
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Quantity
  const [qty, setQty] = useState(1);

  // Toast
  const [showToast, setShowToast] = useState(false);

  // ===== LOAD PRODUCT =====
  useEffect(() => {
    if (!id) return;

    async function loadProduct() {
      setLoading(true);
      setError(false);
      setCurrentImageIndex(0);
      setQty(1);

      try {
        const productData = await getProductById(Number(id));
        setProduct(productData);

        // Load related products by same category
        try {
          const relatedRes = await getProductsByCategory(productData.category);
          setRelated(
            relatedRes.products
              .filter((p) => p.id !== productData.id)
              .slice(0, 4)
          );
        } catch {
          // Related products failing is not critical
          setRelated([]);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  // ===== GALLERY HANDLERS =====
  const goToImage = useCallback(
    (index: number) => setCurrentImageIndex(index),
    []
  );

  const prevImage = useCallback(() => {
    if (!product) return;
    setCurrentImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  }, [product]);

  const nextImage = useCallback(() => {
    if (!product) return;
    setCurrentImageIndex(
      (prev) => (prev + 1) % product.images.length
    );
  }, [product]);

  // ===== CART HANDLERS =====
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
      });
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [product, qty, addItem]);

  const handleBuyNow = useCallback(() => {
    handleAddToCart();
    navigate('/cart');
  }, [handleAddToCart, navigate]);

  // ===== COMPUTED VALUES =====
  const hasDiscount = product ? product.discountPercentage > 5 : false;
  const oldPrice = hasDiscount && product
    ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2)
    : null;
  const stockStatus = product ? getStockStatus(product.stock) : null;

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/catalog">Catálogo</Link>
          <span>/</span>
          <span>Cargando...</span>
        </div>
        <div className="product-layout">
          <div className="gallery-skeleton">
            <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-2xl)' }} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          </div>
          <div className="product-info-skeleton">
            <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 16, width: '50%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 44, width: '40%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 60, width: '100%', marginBottom: 32 }} />
            <div className="skeleton" style={{ height: 120, width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error || !product) {
    return (
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/catalog">Catálogo</Link>
          <span>/</span>
          <span>Error</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <h3>Producto no encontrado</h3>
          <p>El producto que buscas no existe o no está disponible.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <>
      <div className="container">
        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/catalog">Catálogo</Link>
          <span>/</span>
          <span>{product.title}</span>
        </div>

        {/* PRODUCT LAYOUT */}
        <div className="product-layout">
          {/* GALLERY */}
          <div className="gallery">
            <div className="gallery-main">
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                key={currentImageIndex}
              />
              {product.images.length > 1 && (
                <>
                  <button
                    className="gallery-nav gallery-prev"
                    onClick={prevImage}
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    className="gallery-nav gallery-next"
                    onClick={nextImage}
                    aria-label="Imagen siguiente"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="gallery-thumbs">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    className={`gallery-thumb ${i === currentImageIndex ? 'active' : ''}`}
                    onClick={() => goToImage(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img src={img} alt={`${product.title} — imagen ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="product-info">
            <Link
              to={`/catalog?cat=${product.category}`}
              className="product-category"
            >
              {product.category}
            </Link>
            <h1 className="product-title">{product.title}</h1>

            {/* Rating */}
            <div className="product-rating">
              <span className="stars-lg">{renderStars(product.rating)}</span>
              <span className="rating-text">
                <strong>{product.rating}</strong> / 5 · {product.reviews?.length || 0} reviews
              </span>
            </div>

            {/* Price */}
            <div className="product-price-section">
              <span className="product-price">${product.price}</span>
              {oldPrice && (
                <>
                  <span className="product-price-old">${oldPrice}</span>
                  <span className="discount-badge">
                    -{Math.round(product.discountPercentage)}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="product-desc">{product.description}</p>

            {/* Details Grid */}
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">📦</span>
                <span className="detail-label">Marca</span>
                <span className="detail-value">{product.brand || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">⚖️</span>
                <span className="detail-label">Peso</span>
                <span className="detail-value">{product.weight ? `${product.weight}g` : '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">🛡️</span>
                <span className="detail-label">Garantía</span>
                <span className="detail-value">{product.warrantyInformation || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">🔄</span>
                <span className="detail-label">Devolución</span>
                <span className="detail-value">{product.returnPolicy || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">🚚</span>
                <span className="detail-label">Envío</span>
                <span className="detail-value">{product.shippingInformation || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon" aria-hidden="true">📋</span>
                <span className="detail-label">SKU</span>
                <span className="detail-value">{product.sku || '—'}</span>
              </div>
            </div>

            {/* Stock Status */}
            {stockStatus && (
              <div className="stock-status">
                <div className={`stock-dot ${stockStatus.className}`} />
                <span>{stockStatus.text}</span>
              </div>
            )}

            {/* Purchase Section */}
            <div className="purchase-section">
              <div className="qty-selector">
                <button
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="qty-value">{qty}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              <button
                className="btn btn-primary btn-lg purchase-add"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                Agregar al carrito
              </button>
            </div>

            <button
              className="btn btn-secondary btn-lg purchase-buy"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Comprar ahora
            </button>

            {/* Features Row */}
            <div className="features-row">
              <div className="feature">
                <div className="feature-icon" aria-hidden="true">🚚</div>
                Envío gratis +$50
              </div>
              <div className="feature">
                <div className="feature-icon" aria-hidden="true">🔄</div>
                Devolución fácil
              </div>
              <div className="feature">
                <div className="feature-icon" aria-hidden="true">🛡️</div>
                Compra segura
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="container">
          <section className="reviews-section">
            <h2 className="section-title">
              Reviews ({product.reviews.length})
            </h2>
            <div className="reviews-grid">
              {product.reviews.map((review, i) => (
                <div key={i} className="review-card">
                  <div className="review-header">
                    <div className="reviewer">
                      <div className="reviewer-avatar">
                        {review.reviewerName.charAt(0)}
                      </div>
                      <div>
                        <div className="reviewer-name">{review.reviewerName}</div>
                        <div className="reviewer-date">
                          {new Date(review.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="review-stars">{renderStars(review.rating)}</div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <div className="container">
          <section className="related-section">
            <h2 className="section-title">También te podría gustar</h2>
            <div className="related-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TOAST */}
      <div className={`toast ${showToast ? 'show' : ''}`} role="status" aria-live="polite">
        ✓ Agregado al carrito
      </div>
    </>
  );
}
