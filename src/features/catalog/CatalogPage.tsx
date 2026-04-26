/**
 * CatalogPage — Página principal del catálogo de productos.
 *
 * Funcionalidades:
 * - Búsqueda con debounce (300ms) para evitar llamadas excesivas
 * - Filtros laterales: categorías (checkboxes), rango de precio, rating mínimo
 * - Ordenamiento: rating, precio asc/desc, A-Z, mayor descuento
 * - Toggle grid/lista para diferentes vistas de productos
 * - Paginación client-side (12 productos por página)
 * - Active filter chips con opción de remover individual o limpiar todo
 * - Soporte para URL params (?cat= y ?q=) desde el Home
 * - Skeleton loaders durante la carga inicial
 * - Drawer de filtros en mobile
 *
 * ¿Por qué client-side filtering?
 * DummyJSON tiene ~194 productos. Cargarlos todos de una vez (~50KB)
 * y filtrar en el cliente es más rápido que hacer múltiples requests
 * a la API por cada combinación de filtros. Para un catálogo real con
 * miles de productos, la filtración debería ser server-side.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../../shared/services/api';
import ProductCard from '../../shared/components/ProductCard/ProductCard';
import type { Product, ProductCategory } from '../../shared/types/product';
import './CatalogPage.css';

/** Productos por página */
const PER_PAGE = 12;

/** Opciones de ordenamiento disponibles */
const SORT_OPTIONS = [
  { value: 'rating-desc', label: 'Mejor rating' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'title-asc', label: 'A — Z' },
  { value: 'discount-desc', label: 'Mayor descuento' },
] as const;

/** Chips de rating mínimo */
const RATING_OPTIONS = [4, 3, 2] as const;

/** Estado de los filtros activos */
interface Filters {
  search: string;
  categories: string[];
  priceMin: string;
  priceMax: string;
  minRating: number | null;
  sort: string;
}

const INITIAL_FILTERS: Filters = {
  search: '',
  categories: [],
  priceMin: '',
  priceMax: '',
  minRating: null,
  sort: 'rating-desc',
};

export default function CatalogPage() {
  // ===== DATA STATE =====
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== UI STATE =====
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ===== URL PARAMS =====
  const [searchParams] = useSearchParams();
  const initializedRef = useRef(false);

  // ===== SEARCH DEBOUNCE =====
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ===== LOAD DATA =====
  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, cats] = await Promise.all([
          getProducts({ limit: 194 }),
          getCategories(),
        ]);
        setAllProducts(productsRes.products);
        setAllCategories(cats);
      } catch (error) {
        console.error('Error loading catalog data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ===== APPLY URL PARAMS (solo una vez cuando la data está lista) =====
  useEffect(() => {
    if (loading || initializedRef.current) return;
    initializedRef.current = true;

    const catParam = searchParams.get('cat');
    const queryParam = searchParams.get('q');

    if (catParam || queryParam) {
      setFilters((prev) => ({
        ...prev,
        categories: catParam ? [catParam] : prev.categories,
        search: queryParam || prev.search,
      }));
      if (queryParam) setSearchInput(queryParam);
    }
  }, [loading, searchParams]);

  // ===== DEBOUNCED SEARCH =====
  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      setCurrentPage(1);
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ===== FILTER + SORT + PAGINATE (memoizado) =====
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Categorías
    if (filters.categories.length > 0) {
      products = products.filter((p) =>
        filters.categories.includes(p.category)
      );
    }

    // Búsqueda
    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Precio mínimo
    const min = parseFloat(filters.priceMin);
    if (!isNaN(min)) {
      products = products.filter((p) => p.price >= min);
    }

    // Precio máximo
    const max = parseFloat(filters.priceMax);
    if (!isNaN(max)) {
      products = products.filter((p) => p.price <= max);
    }

    // Rating mínimo
    if (filters.minRating) {
      products = products.filter((p) => p.rating >= filters.minRating!);
    }

    // Ordenamiento
    switch (filters.sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'title-asc':
        products.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'discount-desc':
        products.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
    }

    return products;
  }, [allProducts, filters]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  // Reset page si excede total después de filtrar
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // ===== FILTER HANDLERS =====
  const toggleCategory = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter((c) => c !== slug)
        : [...prev.categories, slug],
    }));
    setCurrentPage(1);
  };

  const setMinRating = (rating: number) => {
    setFilters((prev) => ({
      ...prev,
      minRating: prev.minRating === rating ? null : rating,
    }));
    setCurrentPage(1);
  };

  const setPriceMin = (value: string) => {
    setFilters((prev) => ({ ...prev, priceMin: value }));
    setCurrentPage(1);
  };

  const setPriceMax = (value: string) => {
    setFilters((prev) => ({ ...prev, priceMax: value }));
    setCurrentPage(1);
  };

  const setSort = (value: string) => {
    setFilters((prev) => ({ ...prev, sort: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchInput('');
    setCurrentPage(1);
  };

  const removeSearchFilter = () => {
    setFilters((prev) => ({ ...prev, search: '' }));
    setSearchInput('');
    setCurrentPage(1);
  };

  const removeCategoryFilter = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== slug),
    }));
    setCurrentPage(1);
  };

  const removeRatingFilter = () => {
    setFilters((prev) => ({ ...prev, minRating: null }));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // ===== CHECK IF ANY FILTER IS ACTIVE =====
  const hasActiveFilters =
    filters.search !== '' ||
    filters.categories.length > 0 ||
    filters.minRating !== null ||
    filters.priceMin !== '' ||
    filters.priceMax !== '';

  // ===== RENDER =====
  return (
    <>
      {/* PAGE HEADER */}
      <div className="catalog-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link>
            <span>/</span>
            <span>Catálogo</span>
          </div>
          <h1 className="page-title">Catálogo</h1>
          <p className="page-subtitle">
            {loading
              ? 'Cargando productos...'
              : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="container">
        {/* TOOLBAR */}
        <div className="catalog-toolbar">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>
          <div className="toolbar-right">
            <button
              className="btn btn-outline filter-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Mostrar filtros"
            >
              ☰ Filtros
            </button>
            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="view-toggle" role="group" aria-label="Vista de productos">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista cuadrícula"
                aria-pressed={viewMode === 'grid'}
              >
                ▦
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista lista"
                aria-pressed={viewMode === 'list'}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {hasActiveFilters && (
          <div className="active-filters">
            {filters.search && (
              <span
                className="active-filter"
                onClick={removeSearchFilter}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && removeSearchFilter()}
              >
                &ldquo;{filters.search}&rdquo; ✕
              </span>
            )}
            {filters.categories.map((slug) => {
              const cat = allCategories.find((c) => c.slug === slug);
              return (
                <span
                  key={slug}
                  className="active-filter"
                  onClick={() => removeCategoryFilter(slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && removeCategoryFilter(slug)
                  }
                >
                  {cat ? cat.name : slug} ✕
                </span>
              );
            })}
            {filters.minRating && (
              <span
                className="active-filter"
                onClick={removeRatingFilter}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && removeRatingFilter()}
              >
                ★ {filters.minRating}+ ✕
              </span>
            )}
            <span
              className="clear-all"
              onClick={clearFilters}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && clearFilters()}
            >
              Limpiar todo
            </span>
          </div>
        )}

        {/* CATALOG LAYOUT */}
        <div className="catalog-layout">
          {/* SIDEBAR FILTERS */}
          <aside
            className={`catalog-sidebar ${sidebarOpen ? 'open' : ''}`}
            aria-label="Filtros de productos"
          >
            {/* Close button for mobile drawer */}
            {sidebarOpen && (
              <button
                className="sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar filtros"
              >
                ✕
              </button>
            )}

            {/* Categories */}
            <div className="filter-group">
              <div className="filter-title">Categorías</div>
              <div className="filter-options">
                {allCategories.map((cat) => (
                  <label key={cat.slug} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <div className="filter-title">Precio</div>
              <div className="price-range">
                <input
                  type="number"
                  className="price-input"
                  placeholder="Min"
                  min="0"
                  value={filters.priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  aria-label="Precio mínimo"
                />
                <span className="price-sep">—</span>
                <input
                  type="number"
                  className="price-input"
                  placeholder="Max"
                  min="0"
                  value={filters.priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  aria-label="Precio máximo"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="filter-group">
              <div className="filter-title">Rating mínimo</div>
              <div className="filter-chips">
                {RATING_OPTIONS.map((rating) => (
                  <button
                    key={rating}
                    className={`chip ${filters.minRating === rating ? 'active' : ''}`}
                    onClick={() => setMinRating(rating)}
                    aria-pressed={filters.minRating === rating}
                  >
                    ★ {rating}+
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons (visible in mobile drawer) */}
            <button
              className="btn btn-primary sidebar-apply"
              onClick={() => setSidebarOpen(false)}
            >
              Aplicar filtros
            </button>
            <button
              className="btn btn-ghost sidebar-clear"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          </aside>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* PRODUCTS */}
          <div className="catalog-products">
            {loading ? (
              <div className="catalog-grid">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <div key={i} className="product-card-skeleton">
                    <div className="skeleton skeleton-img" />
                    <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div
                        className="skeleton"
                        style={{ height: 14, width: '40%', marginBottom: 8 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 18, width: '70%', marginBottom: 12 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 14, width: '60%', marginBottom: 12 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 22, width: '40%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No se encontraron productos</h3>
                <p>
                  Intenta ajustar tus filtros o buscar algo diferente.
                </p>
                <button
                  className="btn btn-outline"
                  onClick={clearFilters}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div
                className={`catalog-grid ${viewMode === 'list' ? 'list-view' : ''}`}
              >
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && !loading && (
              <nav className="pagination" aria-label="Paginación">
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (
                    totalPages <= 7 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        className={`page-btn ${page === currentPage ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="page-ellipsis">
                        …
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                >
                  →
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
