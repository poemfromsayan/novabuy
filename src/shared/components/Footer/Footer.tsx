import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              Nova<span>Buy</span>
            </Link>
            <p className="footer-desc">
              Tu tienda online de confianza. Productos de calidad con envío
              rápido y garantía en cada compra.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Tienda</h4>
            <ul className="footer-links">
              <li><Link to="/catalog">Catálogo</Link></li>
              <li><Link to="/catalog">Ofertas</Link></li>
              <li><Link to="/catalog">Nuevos</Link></li>
              <li><Link to="/catalog">Populares</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Soporte</h4>
            <ul className="footer-links">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Envíos</a></li>
              <li><a href="#">Devoluciones</a></li>
              <li><a href="#">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Legal</h4>
            <ul className="footer-links">
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Términos</a></li>
              <li><a href="#">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 NovaBuy. Todos los derechos reservados.</span>
          <span>Hecho con 💚 por Saúl</span>
        </div>
      </div>
    </footer>
  );
}
