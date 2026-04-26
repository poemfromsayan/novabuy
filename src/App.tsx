/**
 * App.tsx — Punto de entrada de la aplicación.
 *
 * Estructura:
 * - BrowserRouter envuelve todo para habilitar navegación SPA
 * - ThemeProvider y CartProvider son los Context providers globales
 * - Layout contiene Navbar + <Outlet /> + Footer
 * - Cada <Route> renderiza una página dentro del Layout
 *
 * ¿Por qué lazy loading?
 * Las páginas se cargan bajo demanda (code splitting).
 * Esto reduce el bundle inicial — el usuario solo descarga
 * el código de la página que está visitando.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './shared/context/ThemeContext';
import { CartProvider } from './shared/context/CartContext';
import Layout from './shared/components/Layout/Layout';

// Pages — importación directa (implementaremos lazy loading después)
import HomePage from './features/home/HomePage';
import CatalogPage from './features/catalog/CatalogPage';
import ProductPage from './features/product/ProductPage';
import CartPage from './features/cart/CartPage';
import CheckoutPage from './features/checkout/CheckoutPage';

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
