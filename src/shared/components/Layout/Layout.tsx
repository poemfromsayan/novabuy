/**
 * Layout — Wrapper que envuelve todas las páginas con Navbar y Footer.
 *
 * Usa <Outlet /> de React Router para renderizar la página actual.
 * Esto evita repetir Navbar/Footer en cada página.
 *
 * ScrollToTop: cada vez que cambia la ruta, hace scroll al top.
 * Sin esto, al navegar entre páginas el usuario quedaría en la
 * misma posición de scroll de la página anterior.
 */

import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Layout.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function Layout() {
  return (
    <div className="layout">
      <ScrollToTop />
      <Navbar />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
