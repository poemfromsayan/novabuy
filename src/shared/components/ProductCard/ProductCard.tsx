/**
 * ProductCard — Componente reutilizable para mostrar un producto.
 *
 * Se usa en: Home (featured + trending), Catálogo (grid), y Producto (related).
 * Incluye: imagen con hover zoom, badge de descuento, wishlist button,
 * categoría, título, rating con estrellas, precio, y botón de agregar al carrito.
 */

import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types/product';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

/** Genera estrellas visuales a partir del rating numérico */
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const hasDiscount = product.discountPercentage > 5;
  const oldPrice = hasDiscount
    ? (product.price / (1 - product.discountPercentage / 100)).toFixed(0)
    : null;

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que el click navegue al detalle
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
    });
  };

  return (
    <article className="product-card" onClick={handleClick}>
      <div className="card-img">
        {hasDiscount && (
          <span className="badge">
            -{Math.round(product.discountPercentage)}%
          </span>
        )}
        <button
          className="wishlist-btn"
          onClick={(e) => e.stopPropagation()}
          aria-label="Agregar a favoritos"
        >
          ♡
        </button>
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
        />
      </div>

      <div className="card-body">
        <span className="card-category">{product.category}</span>
        <h3 className="card-title">{product.title}</h3>

        <div className="card-rating">
          <span className="stars">{renderStars(product.rating)}</span>
          <span className="rating-num">{product.rating}</span>
        </div>

        <div className="card-footer">
          <div className="price">
            ${product.price}
            {oldPrice && <span className="price-old">${oldPrice}</span>}
          </div>
          <button
            className="btn-add"
            onClick={handleAddToCart}
            aria-label={`Agregar ${product.title} al carrito`}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
