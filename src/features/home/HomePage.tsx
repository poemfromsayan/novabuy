import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../../shared/services/api';
import ProductCard from '../../shared/components/ProductCard/ProductCard';
import type { Product, ProductCategory } from '../../shared/types/product';
import './HomePage.css';

const CATEGORY_ICONS: Record<string, string> = {
  beauty: '💄', fragrances: '🌸', furniture: '🪑', groceries: '🛒',
  'home-decoration': '🏠', 'kitchen-accessories': '🍳', laptops: '💻',
  'mens-shirts': '👔', 'mens-shoes': '👞', 'mens-watches': '⌚',
  'mobile-accessories': '📱', motorcycle: '🏍️', 'skin-care': '✨',
  smartphones: '📲', 'sports-accessories': '⚽', sunglasses: '🕶️',
  tablets: '📋', tops: '👚', vehicle: '🚗', 'womens-bags': '👜',
  'womens-dresses': '👗', 'womens-jewellery': '💎', 'womens-shoes': '👠',
  'womens-watches': '⌚',
};

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featuredRes, trendingRes, cats] = await Promise.all([
          getProducts({ limit: 8, sortBy: 'rating', order: 'desc' }),
          getProducts({ limit: 6, skip: 10 }),
          getCategories(),
        ]);
        setFeatured(featuredRes.products);
        setTrending(trendingRes.products);
        setCategories(cats.slice(0, 6));
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="hero-tag">✨ Nueva colección disponible</div>
            <h1>
              Descubre productos que{' '}
              <span className="accent">inspiran</span>
            </h1>
            <p>
              Explora nuestra colección curada de productos premium. Envío
              gratis en compras mayores a $50, garantía extendida y atención
              personalizada.
            </p>
            <div className="hero-actions">
              <Link to="/catalog" className="btn btn-primary btn-lg">
                Explorar catálogo →
              </Link>
              <a href="#trending" className="btn btn-outline btn-lg">
                Ver tendencias
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">200+</div>
                <div className="hero-stat-label">Productos</div>
              </div>
              <div>
                <div className="hero-stat-value">24</div>
                <div className="hero-stat-label">Categorías</div>
              </div>
              <div>
                <div className="hero-stat-value">4.8★</div>
                <div className="hero-stat-label">Rating promedio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-overline">Explora</div>
              <h2 className="section-title">Categorías populares</h2>
            </div>
            <Link to="/catalog" className="btn btn-ghost">
              Ver todas →
            </Link>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/catalog?cat=${cat.slug}`}
                className="category-card"
              >
                <div className="category-icon">
                  {CATEGORY_ICONS[cat.slug] || '📦'}
                </div>
                <div className="category-name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-overline">Lo más vendido</div>
              <h2 className="section-title">Productos destacados</h2>
              <p className="section-subtitle">
                Los favoritos de nuestros clientes esta semana.
              </p>
            </div>
            <Link to="/catalog" className="btn btn-outline">
              Ver todo
            </Link>
          </div>
          <div className="products-grid">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="product-card-skeleton">
                    <div className="skeleton skeleton-img" />
                    <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 22, width: '40%' }} />
                    </div>
                  </div>
                ))
              : featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <h2>Envío gratis en tu primera compra</h2>
              <p>
                Regístrate hoy y obtén envío gratuito + 10% de descuento en tu
                primer pedido. Sin trucos, sin letra pequeña.
              </p>
              <Link to="/checkout" className="btn btn-primary btn-lg">
                Crear cuenta gratis
              </Link>
            </div>
            <div className="cta-features">
              <div className="cta-feature">
                <div className="cta-feature-icon">🚚</div>
                Envío gratis en pedidos +$50
              </div>
              <div className="cta-feature">
                <div className="cta-feature-icon">🔄</div>
                Devoluciones gratis por 30 días
              </div>
              <div className="cta-feature">
                <div className="cta-feature-icon">🛡️</div>
                Garantía de satisfacción
              </div>
              <div className="cta-feature">
                <div className="cta-feature-icon">💬</div>
                Soporte 24/7 por chat
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <section className="section" style={{ paddingTop: 0 }} id="trending">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-overline">Trending</div>
              <h2 className="section-title">Tendencias de la semana</h2>
            </div>
          </div>
          <div className="trending-scroll">
            {trending.map((p) => (
              <div key={p.id} className="trending-card">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="container">
          <h2>Mantente al día</h2>
          <p>
            Suscríbete para recibir ofertas exclusivas, lanzamientos y
            recomendaciones personalizadas.
          </p>
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input');
              if (input) {
                input.value = '¡Suscrito! ✓';
                input.disabled = true;
              }
            }}
          >
            <input type="email" placeholder="tu@email.com" required />
            <button className="btn btn-primary" type="submit">
              Suscribirse
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
