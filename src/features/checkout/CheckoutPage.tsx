/**
 * CheckoutPage — Flujo de checkout multi-step.
 *
 * Pasos:
 * 1. Carrito (ya completado — el user viene de /cart)
 * 2. Información: email + dirección de envío con validación
 * 3. Pago: selección de método (card/paypal/transfer) + campos de tarjeta
 * 4. Confirmación: success overlay con número de orden
 *
 * ¿Por qué un solo componente con state machine simple?
 * Para un checkout de portafolio, no necesitamos un router anidado
 * ni una librería de forms. Un `currentStep` con switch en el render
 * mantiene todo legible y demuestra manejo de estado complejo con
 * React puro. En producción, usarías react-hook-form + zod para
 * validación y un stepper más robusto.
 */

import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../shared/context/CartContext';
import './CheckoutPage.css';

/** Steps del checkout */
type Step = 'info' | 'payment' | 'success';

/** Form data para información de contacto y envío */
interface ShippingInfo {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

/** Métodos de pago disponibles */
type PaymentMethod = 'card' | 'paypal' | 'transfer';

/** Datos de tarjeta */
interface CardData {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}

/** Tax rate y shipping threshold (mismos que CartPage) */
const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 4.99;

/** Opciones de estado (México) */
const STATE_OPTIONS = ['CDMX', 'Jalisco', 'Nuevo León', 'Puebla', 'Otro'];

const INITIAL_SHIPPING: ShippingInfo = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
};

const INITIAL_CARD: CardData = {
  number: '',
  holder: '',
  expiry: '',
  cvv: '',
};

export default function CheckoutPage() {
  const { items, totalItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // ===== STEP STATE =====
  const [currentStep, setCurrentStep] = useState<Step>('info');

  // ===== FORM STATE =====
  const [shipping, setShipping] = useState<ShippingInfo>(INITIAL_SHIPPING);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardData, setCardData] = useState<CardData>(INITIAL_CARD);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, boolean>>>({});
  const [orderNumber, setOrderNumber] = useState('');

  // ===== COMPUTED =====
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shippingCost + tax;

  // ===== REDIRECT IF EMPTY CART =====
  useEffect(() => {
    if (items.length === 0 && currentStep !== 'success') {
      navigate('/cart');
    }
  }, [items.length, currentStep, navigate]);

  // ===== VALIDATION =====
  const validateInfo = useCallback((): boolean => {
    const required: (keyof ShippingInfo)[] = ['email', 'firstName', 'lastName', 'address', 'city', 'zip'];
    const newErrors: Partial<Record<keyof ShippingInfo, boolean>> = {};
    let valid = true;

    required.forEach((field) => {
      if (!shipping[field].trim()) {
        newErrors[field] = true;
        valid = false;
      }
    });

    // Basic email validation
    if (shipping.email && !shipping.email.includes('@')) {
      newErrors.email = true;
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [shipping]);

  // ===== STEP NAVIGATION =====
  const goToPayment = () => {
    if (!validateInfo()) return;
    setCurrentStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBackToInfo = () => {
    setCurrentStep('info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeOrder = () => {
    // Generate order number
    const num = 'NB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setOrderNumber(num);
    setCurrentStep('success');
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== INPUT HANDLERS =====
  const updateShipping = (field: keyof ShippingInfo, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const updateCard = (field: keyof CardData, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  /** Auto-format card number: adds spaces every 4 digits */
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19); // max 16 digits + 3 spaces
  };

  /** Auto-format expiry: adds slash after MM */
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  // ===== STEP INDICATOR =====
  const stepConfig = [
    { key: 'cart', label: 'Carrito', completed: true },
    { key: 'info', label: 'Información', completed: currentStep === 'payment' || currentStep === 'success', active: currentStep === 'info' },
    { key: 'payment', label: 'Pago', completed: currentStep === 'success', active: currentStep === 'payment' },
    { key: 'success', label: 'Confirmación', completed: false, active: currentStep === 'success' },
  ];

  // ===== SUCCESS STATE =====
  if (currentStep === 'success') {
    return (
      <div className="checkout-success">
        <div className="success-check" aria-hidden="true">✓</div>
        <h2>¡Pedido confirmado!</h2>
        <p>
          Gracias por tu compra. Recibirás un email con los detalles de tu
          pedido y la información de seguimiento.
        </p>
        <div className="order-number">{orderNumber}</div>
        <div className="success-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            Volver al inicio
          </Link>
          <Link to="/catalog" className="btn btn-outline btn-lg">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="container">
      {/* STEPS INDICATOR */}
      <div className="steps" aria-label="Progreso del checkout">
        {stepConfig.map((step, i) => (
          <div key={step.key} className="step-wrapper">
            <div
              className={`step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
            >
              <span className="step-num">
                {step.completed ? '✓' : i + 1}
              </span>
              <span className="step-label">{step.label}</span>
            </div>
            {i < stepConfig.length - 1 && (
              <div className={`step-line ${step.completed ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* CHECKOUT LAYOUT */}
      <div className="checkout-layout">
        {/* FORM AREA */}
        <div className="checkout-form">
          {currentStep === 'info' && (
            <>
              {/* Contact Info */}
              <div className="form-section">
                <h2 className="form-title">
                  <span className="form-title-icon" aria-hidden="true">📧</span>
                  Información de contacto
                </h2>
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label" htmlFor="email">
                      Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="tu@email.com"
                      value={shipping.email}
                      onChange={(e) => updateShipping('email', e.target.value)}
                    />
                    {errors.email && <span className="form-error">Email es requerido</span>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="form-section">
                <h2 className="form-title">
                  <span className="form-title-icon" aria-hidden="true">📍</span>
                  Dirección de envío
                </h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">
                      Nombre <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className={`form-input ${errors.firstName ? 'error' : ''}`}
                      placeholder="Juan"
                      value={shipping.firstName}
                      onChange={(e) => updateShipping('firstName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">
                      Apellido <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className={`form-input ${errors.lastName ? 'error' : ''}`}
                      placeholder="Pérez"
                      value={shipping.lastName}
                      onChange={(e) => updateShipping('lastName', e.target.value)}
                    />
                  </div>
                  <div className="form-group full">
                    <label className="form-label" htmlFor="address">
                      Dirección <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      className={`form-input ${errors.address ? 'error' : ''}`}
                      placeholder="Calle, número, colonia"
                      value={shipping.address}
                      onChange={(e) => updateShipping('address', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="city">
                      Ciudad <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      className={`form-input ${errors.city ? 'error' : ''}`}
                      placeholder="Ciudad de México"
                      value={shipping.city}
                      onChange={(e) => updateShipping('city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="state">Estado</label>
                    <select
                      id="state"
                      className="form-input"
                      value={shipping.state}
                      onChange={(e) => updateShipping('state', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {STATE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="zip">
                      Código postal <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="zip"
                      className={`form-input ${errors.zip ? 'error' : ''}`}
                      placeholder="01000"
                      value={shipping.zip}
                      onChange={(e) => updateShipping('zip', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Teléfono</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-input"
                      placeholder="+52 55 1234 5678"
                      value={shipping.phone}
                      onChange={(e) => updateShipping('phone', e.target.value)}
                    />
                    <span className="form-hint">Para actualizaciones del envío</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="form-nav">
                <Link to="/cart" className="btn btn-ghost">
                  ← Volver al carrito
                </Link>
                <button className="btn btn-primary btn-lg" onClick={goToPayment}>
                  Continuar al pago →
                </button>
              </div>
            </>
          )}

          {currentStep === 'payment' && (
            <>
              <div className="form-section">
                <h2 className="form-title">
                  <span className="form-title-icon" aria-hidden="true">💳</span>
                  Método de pago
                </h2>

                {/* Payment Methods */}
                <div className="payment-methods">
                  <label
                    className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <div className="payment-method-info">
                      <div className="payment-method-name">Tarjeta de crédito / débito</div>
                      <div className="payment-method-desc">Visa, Mastercard, AMEX</div>
                    </div>
                    <div className="payment-icons" aria-hidden="true">💳</div>
                  </label>
                  <label
                    className={`payment-method ${paymentMethod === 'paypal' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                    />
                    <div className="payment-method-info">
                      <div className="payment-method-name">PayPal</div>
                      <div className="payment-method-desc">Paga con tu cuenta PayPal</div>
                    </div>
                    <div className="payment-icons" aria-hidden="true">🅿️</div>
                  </label>
                  <label
                    className={`payment-method ${paymentMethod === 'transfer' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === 'transfer'}
                      onChange={() => setPaymentMethod('transfer')}
                    />
                    <div className="payment-method-info">
                      <div className="payment-method-name">Transferencia bancaria</div>
                      <div className="payment-method-desc">SPEI — se procesa en 1-2 días</div>
                    </div>
                    <div className="payment-icons" aria-hidden="true">🏦</div>
                  </label>
                </div>

                {/* Card Fields (only when card selected) */}
                {paymentMethod === 'card' && (
                  <div className="card-fields">
                    <div className="form-group card-number-group">
                      <label className="form-label">
                        Número de tarjeta <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) => updateCard('number', formatCardNumber(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Titular</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="JUAN PÉREZ"
                        value={cardData.holder}
                        onChange={(e) => updateCard('holder', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vencimiento</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={(e) => updateCard('expiry', formatExpiry(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="123"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={(e) => updateCard('cvv', e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="form-nav">
                <button className="btn btn-ghost" onClick={goBackToInfo}>
                  ← Volver
                </button>
                <button className="btn btn-primary btn-lg" onClick={placeOrder}>
                  Confirmar pedido →
                </button>
              </div>
            </>
          )}
        </div>

        {/* ORDER SUMMARY SIDEBAR */}
        <aside className="order-summary">
          <h3 className="summary-title">Tu pedido ({totalItems} items)</h3>

          <div className="summary-items">
            {items.map((item) => (
              <div key={item.id} className="summary-item">
                <div className="summary-item-img">
                  <img src={item.thumbnail} alt={item.title} />
                  <span className="summary-item-qty">{item.qty}</span>
                </div>
                <div className="summary-item-info">
                  <div className="summary-item-name">{item.title}</div>
                </div>
                <div className="summary-item-price">
                  ${(item.price * item.qty).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-divider" />

          <div className="summary-row">
            <span className="label">Subtotal</span>
            <span className="value">${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="label">Envío</span>
            <span className={`value ${shippingCost === 0 ? 'free' : ''}`}>
              {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div className="summary-row">
            <span className="label">Impuestos</span>
            <span className="value">${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Link to="/cart" className="edit-cart">
            Editar carrito
          </Link>
        </aside>
      </div>
    </div>
  );
}
