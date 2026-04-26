# NovaBuy — E-Commerce SPA

Un e-commerce moderno y completo construido con React, TypeScript y CSS nativo, diseñado siguiendo un enfoque Design-First.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)
![CSS Native](https://img.shields.io/badge/CSS-Custom_Properties-orange?logo=css3)

## Demo

> _Agrega aquí el link de tu deploy en Vercel/Netlify_

## Tecnologías

- **React 19** — Componentes funcionales con Hooks
- **TypeScript** — Tipado estricto en toda la aplicación
- **Vite** — Bundler ultrarrápido con HMR
- **React Router v7** — Navegación SPA con rutas protegidas
- **Context API + useReducer** — Estado global del carrito sin dependencias externas
- **CSS Nativo con Custom Properties** — Design tokens para colores, tipografía, espaciado y breakpoints
- **DummyJSON API** — Datos de productos reales vía REST

## Características

- 5 vistas completas: Home, Catálogo, Producto, Carrito y Checkout
- Búsqueda con debounce (300ms) y filtros client-side (categoría, precio, rating)
- Galería de producto interactiva con thumbnails y navegación
- Carrito persistente en localStorage con badge dinámico en navbar
- Checkout multi-step con validación de formularios y 3 métodos de pago
- Dark mode con toggle y persistencia de preferencia
- Diseño responsive mobile-first adaptable a cualquier viewport
- Arquitectura modular por features (escalable)

## Estructura del Proyecto

src/
├── features/
│   ├── home/          # Landing con hero, categorías y productos destacados
│   ├── catalog/       # Catálogo con filtros, sort y paginación
│   ├── product/       # Detalle de producto con galería y reviews
│   ├── cart/          # Carrito con resumen y barra de envío gratis
│   └── checkout/      # Flujo multi-step (info → pago → confirmación)
├── shared/
│   ├── components/    # Navbar, Footer, ProductCard
│   ├── context/       # CartContext (useReducer + localStorage)
│   └── services/      # API layer (fetch wrapper + endpoints)
└── styles/
├── tokens.css     # Design tokens + dark mode + responsive overrides
└── global.css     # Reset, utilidades y clases base

## Instalación

```bash
git clone https://github.com/poemfromsayan/novabuy.git
cd novabuy
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción optimizado |
| `npm run preview` | Preview del build de producción |

## Decisiones Técnicas

- **CSS nativo sobre Tailwind/Styled-Components**: Demuestra dominio profundo de CSS y genera zero runtime overhead. Los design tokens vía custom properties permiten theming (dark mode) y responsive scaling sin clases utilitarias.
- **Client-side filtering**: Con ~194 productos de DummyJSON, filtrar en el cliente es más rápido que múltiples requests por cada cambio de filtro.
- **useReducer sobre Redux/Zustand**: Para el scope de este proyecto, Context + useReducer ofrece suficiente poder sin agregar dependencias externas.
- **Feature-based architecture**: Cada feature es autocontenida (componente + CSS + lógica), facilitando escalabilidad y mantenimiento.

## Autor

**Adrián Rojas** — Desarrollador y Diseñador Web

---

Hecho con React + TypeScript + mucho CSS ✨