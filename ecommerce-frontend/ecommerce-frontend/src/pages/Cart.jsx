import { Link } from 'react-router-dom'
import useCart from '../hooks/useCart.js'

const formatPrice = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

function Cart() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCart()

  return (
    <section className="page">
      <p className="eyebrow">Your selection</p>
      <h1>Your bag</h1>
      {items.length === 0 ? (
        <div className="empty-cart">
          <p className="page-intro">Your bag is waiting for something lovely.</p>
          <Link className="primary-link" to="/products">Continue shopping <span aria-hidden="true">&nbsp;→</span></Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <img
                  className="cart-item-image"
                  src={item.imageUrl || ''}
                  alt={item.name}
                />
                <div className="cart-item-details">
                  <h2>{item.name}</h2>
                  <p className="cart-unit-price">{formatPrice(item.price)} each</p>
                  <div className="cart-item-actions">
                    <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        disabled={item.cartQuantity <= 1}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.cartQuantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                        disabled={item.cartQuantity >= item.quantity}
                      >
                        +
                      </button>
                    </div>
                    <button className="text-button" type="button" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <p className="cart-line-total">{formatPrice(item.price * item.cartQuantity)}</p>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div className="summary-line">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className="summary-line">
              <span>Total</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <Link className="button-primary checkout-link" to="/checkout">Continue to checkout</Link>
            <Link className="continue-link" to="/products">Continue shopping</Link>
          </aside>
        </div>
      )}
    </section>
  )
}

export default Cart