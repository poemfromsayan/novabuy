import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          Nova<span>Buy</span>
        </Link>

        <ul className="nav-links">
          <li>
            <NavLink to="/" end>
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/catalog">Catálogo</NavLink>
          </li>
          <li>
            <NavLink to="/cart">Carrito</NavLink>
          </li>
        </ul>

        <div className="nav-actions">
          <button
            className="nav-icon nav-theme"
            onClick={toggleTheme}
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <Link to="/cart" className="nav-icon" aria-label="Ver carrito">
            🛒
            {totalItems > 0 && (
              <span className="nav-badge">{totalItems}</span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
