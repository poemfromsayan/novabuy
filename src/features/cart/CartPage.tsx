/**
 * CartPage — Página del carrito de compras.
 *
 * Funcionalidades:
 * - Lista de items con imagen, título, precio unitario y total por item
 * - Selector de cantidad por item (min 1)
 * - Eliminar item individual + vaciar carrito completo
 * - Sidebar de resumen: subtotal, envío (gratis >$50), impuestos, total
 * - Barra de progreso hacia envío gratis ($50 threshold)
 * - Campo de código promocional (UI only para portafolio)
 * - Empty state con CTA hacia catálogo
 * - Link a checkout
 *
 * ¿Por qué useCart hook?
 * Todo el estado del carrito vive en CartContext con useReducer.
 * Este componente solo lee y despacha acciones — no maneja estado local
 * del carrito. Esto garantiza consistencia con el badge del navbar
 * y persistencia en localStorage.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../shared/context/CartContext';
import './CartPage.css';

/** Tax rate (8% estimado) */
const TAX_RATE = 0.08;
/** Free shipping threshold */
const FREE_SHIPPING_THRESHOLD = 50;
/** Shipping cost when below threshold */
const SHIPPING_COST = 4.99;

export default function CartPage() {
  const { items, totalItems, subtotal, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // ===== COMPUTED VALUES =====
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // ===== HANDLERS =====
  const handlePromoApply = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
      // En un app real, validaríamos contra una API
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // ===== EMPTY STATE =====
  if (items.length === 0) {
    return (
      <div className="container cart-container">
        <div className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <span>Carrito</span>
        </div>
        <h1 className="page-title">Tu carrito</h1>

        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>
            Parece que aún no has agregado productos. Explora nuestro catálogo
            y encuentra algo que te guste.
          </p>
          <Link to="/catalog" className="btn btn-primary btn-lg">
            Explorar catálogo
          </Link>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="container cart-container">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <span>Carrito</span>
      </div>
      <h1 className="page-title">Tu carrito</h1>
      <p className="page-subtitle">
        {totalItems} producto{totalItems !== 1 ? 's' : ''} en tu carrito
      </p>

      <div className="cart-layout">
        {/* CART ITEMS */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <Link to={`/product/${item.id}`} className="cart-item-img">
                <img src={item.thumbnail} alt={item.title} />
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.id}`} className="cart-item-title">
                  {item.title}
                </Link>
                <div className="cart-item-price">${item.price.toFixed(2)}</div>
                <div className="cart-item-actions">
                  <div className="qty-selector">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                      aria-label="Reducir cantidad"
                    >
                      −
                    </button>
                    <span className="qty-val">{item.qty}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="cart-item-right">
                <div className="cart-item-total">
                  ${(item.price * item.qty).toFixed(2)}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Eliminar ${item.title} del carrito`}
                >
                  ✕ Eliminar
                </button>
              </div>
            </div>
          ))}

          {/* Bottom actions */}
          <div className="cart-bottom-actions">
            <Link to="/catalog" className="btn btn-ghost">
              ← Seguir comprando
            </Link>
            <button className="btn btn-danger" onClick={clearCart}>
              Vaciar carrito
            </button>
          </div>
        </div>

        {/* SUMMARY SIDEBAR */}
        <aside className="cart-summary">
          <h3 className="summary-title">Resumen del pedido</h3>

          <div className="summary-row">
            <span className="summary-label">Subtotal ({totalItems} items)</span>
            <span className="summary-value">${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Envío</span>
            <span className={`summary-value ${shipping === 0 ? 'summary-savings' : ''}`}>
              {shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Impuestos (est.)</span>
            <span className="summary-value">${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {/* Free Shipping Progress */}
          <div className="free-shipping-bar">
            {freeShippingRemaining > 0 ? (
              <p>
                🚚 Te faltan <strong>${freeShippingRemaining.toFixed(2)}</strong> para envío gratis
              </p>
            ) : (
              <p>🎉 ¡Tienes envío gratis!</p>
            )}
            {freeShippingRemaining > 0 && (
              <div className="shipping-progress">
                <div
                  className="shipping-progress-fill"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Promo Code */}
          <div className="promo-section">
            <input
              type="text"
              className="promo-input"
              placeholder="Código promocional"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoApplied}
              aria-label="Código promocional"
            />
            <button
              className="btn btn-outline"
              onClick={handlePromoApply}
              disabled={promoApplied || !promoCode.trim()}
            >
              {promoApplied ? '✓' : 'Aplicar'}
            </button>
          </div>

          {/* Checkout Button */}
          <button
            className="btn btn-primary btn-lg checkout-btn"
            onClick={handleCheckout}
          >
            Proceder al checkout →
          </button>

          <div className="secure-note">
            🔒 Pago seguro con encriptación SSL
          </div>
        </aside>
      </div>
    </div>
  );
}
