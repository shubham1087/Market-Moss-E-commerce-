import { useCallback, useMemo, useState } from 'react'
import { CartContext } from './cartContext.js'

function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product || product.id == null || !Number.isFinite(product.quantity)
      || !Number.isInteger(quantity) || quantity < 1) {
      return { success: false, message: 'This product cannot be added to your bag.' }
    }

    const existingItem = items.find((item) => item.id === product.id)
    const currentQuantity = existingItem?.cartQuantity ?? 0
    const remainingQuantity = product.quantity - currentQuantity

    if (quantity > remainingQuantity) {
      return {
        success: false,
        message: remainingQuantity > 0
          ? `Only ${remainingQuantity} more available.`
          : 'This item is out of stock.',
      }
    }

    setItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.id === product.id)

      if (currentItem) {
        return currentItems.map((item) => (
          item.id === product.id
            ? { ...item, ...product, cartQuantity: item.cartQuantity + quantity }
            : item
        ))
      }

      return [...currentItems, { ...product, cartQuantity: quantity }]
    })

    return {
      success: true,
      message: quantity === 1
        ? `${product.name} added to your bag.`
        : `${quantity} × ${product.name} added to your bag.`,
    }
  }, [items])

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === productId
        ? { ...item, cartQuantity: Math.max(1, Math.min(quantity, item.quantity)) }
        : item
    )))
  }, [])

  const removeFromCart = useCallback((productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const itemCount = items.reduce((total, item) => total + item.cartQuantity, 0)
  const subtotal = items.reduce((total, item) => total + item.price * item.cartQuantity, 0)

  const value = useMemo(() => ({
    items,
    itemCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }), [items, itemCount, subtotal, addToCart, updateQuantity, removeFromCart, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
