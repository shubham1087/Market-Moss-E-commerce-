import { useState } from 'react'
import useCart from '../hooks/useCart.js'

function ProductCard({ product }) {
  const { addToCart, items } = useCart()
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(product.price)

  const imageUrl = product.imageUrl || ''

  const cartQuantity = items.find((item) => item.id === product.id)?.cartQuantity ?? 0
  const unavailable = product.quantity <= cartQuantity

  function handleAddToCart() {
    const result = addToCart(product)
    setMessage(result.message)
    setMessageIsError(!result.success)
  }

  return (
    <article className="product-card">

      <div className="product-image-wrap">
        <img
          className="product-image"
          src={imageUrl}
          alt={product.name}
        />
       
      </div>

      <div className="product-card-content">

        <p className="product-category">
          {product.category?.name || 'Uncategorized'}
        </p>

        <h2>{product.name}</h2>

        <p className="product-description">
          {product.description}
        </p>

        <div className="product-card-footer">
          <span className="product-price">
            {price}
          </span>

          <span className="product-quantity">
            {product.quantity} available
          </span>
        </div>

        <button
          className="button-primary add-to-cart-button"
          type="button"
          onClick={handleAddToCart}
          disabled={unavailable}
        >
          {unavailable ? 'Stock limit reached' : 'Add to Bag'}
        </button>
        {message && (
          <p className={messageIsError ? 'cart-feedback error' : 'cart-feedback'} role={messageIsError ? 'alert' : 'status'}>
            {message}
          </p>
        )}
      </div>

    </article>
  )
}

export default ProductCard