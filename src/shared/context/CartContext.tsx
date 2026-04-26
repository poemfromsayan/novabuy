/**
 * CartContext — Estado global del carrito de compras.
 *
 * Usa useReducer en lugar de useState porque:
 * 1. El carrito tiene múltiples acciones (add, remove, update qty, clear)
 * 2. Cada acción tiene lógica diferente (buscar item existente, recalcular totales)
 * 3. useReducer hace explícito cada caso → más fácil de debuggear y testear
 *
 * Persiste en localStorage para que el carrito sobreviva recargas de página.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/* ===== TYPES ===== */

export interface CartItem {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'qty'> & { qty?: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QTY'; payload: { id: number; qty: number } }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; payload: CartItem[] };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
}

/* ===== REDUCER ===== */

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id);
      const addQty = action.payload.qty ?? 1;

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, qty: i.qty + addQty }
              : i
          ),
        };
      }

      return {
        items: [...state.items, { ...action.payload, qty: addQty }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((i) => i.id !== action.payload.id),
      };

    case 'UPDATE_QTY': {
      if (action.payload.qty < 1) {
        return {
          items: state.items.filter((i) => i.id !== action.payload.id),
        };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, qty: action.payload.qty }
            : i
        ),
      };
    }

    case 'CLEAR':
      return { items: [] };

    case 'HYDRATE':
      return { items: action.payload };

    default:
      return state;
  }
}

/* ===== CONTEXT ===== */

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'novabuy-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hidratar desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        if (Array.isArray(items)) {
          dispatch({ type: 'HYDRATE', payload: items });
        }
      }
    } catch {
      // localStorage corrupto o no disponible
    }
  }, []);

  // Persistir en localStorage cada vez que cambia el estado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Silenciar
    }
  }, [state.items]);

  /* Valores derivados (calculados en cada render) */
  const totalItems = state.items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  /* Actions envueltas en useCallback para estabilidad referencial */
  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qty?: number) => {
      dispatch({ type: 'ADD_ITEM', payload: { ...item, qty } });
    },
    []
  );

  const removeItem = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <CartContext.Provider
      value={{ items: state.items, totalItems, subtotal, addItem, removeItem, updateQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook para acceder al carrito desde cualquier componente.
 */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un <CartProvider>');
  }
  return context;
}
