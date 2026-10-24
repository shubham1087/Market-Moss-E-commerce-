import { useEffect, useState } from 'react'
import Loading from '../components/Loading.jsx'
import useAuth from '../hooks/useAuth.js'
import api from '../services/api.js'

const formatPrice = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

function hasValidOrderShape(order) {
  return order !== null
    && typeof order === 'object'
    && typeof order.orderId === 'number'
    && Number.isInteger(order.orderId)
    && typeof order.createdAt === 'string'
    && !Number.isNaN(Date.parse(order.createdAt))
    && typeof order.status === 'string'
    && typeof order.totalAmount === 'number'
    && Number.isFinite(order.totalAmount)
    && Array.isArray(order.items)
    && order.items.every((item) => item !== null
        && typeof item === 'object'
        && typeof item.productName === 'string'
        && typeof item.price === 'number'
        && Number.isFinite(item.price)
        && typeof item.quantity === 'number'
        && Number.isInteger(item.quantity)
        && typeof item.subtotal === 'number'
        && Number.isFinite(item.subtotal))
}

function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchOrders() {
      try {
        const response = await api.get(`/orders/user/${user.userId}`, {
          signal: controller.signal,
        })

        if (!Array.isArray(response.data) || !response.data.every(hasValidOrderShape)) {
          throw new Error('Unexpected orders response format')
        }

        setOrders(response.data)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          const serverMessage = requestError?.response?.data?.message
          setError(
            typeof serverMessage === 'string' && serverMessage.trim()
              ? serverMessage
              : requestError.message === 'Unexpected orders response format'
                ? 'The orders service returned data in an unexpected format.'
                : 'Unable to load orders. Please try again later.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => controller.abort()
  }, [user.userId])

  return (
    <section className="page">
      <p className="eyebrow">Your account</p>
      <h1>Your orders</h1>
      <p className="page-intro">A record of the things you have brought home.</p>

      {loading && <Loading />}
      {!loading && error && <p className="error-state" role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="empty-state">You have no orders yet.</p>
      )}
      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.orderId}>
              <header className="order-card-header">
                <div>
                  <p className="order-label">Order</p>
                  <h2>#{order.orderId}</h2>
                </div>
                <span className="order-status">{order.status}</span>
              </header>

              <dl className="order-summary">
                <div>
                  <dt>Order date</dt>
                  <dd>{new Date(order.createdAt).toLocaleString('en-IN')}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatPrice(order.totalAmount)}</dd>
                </div>
              </dl>

              <div className="order-items">
                <h3>Items</h3>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <ul>
                    {order.items.map((item, index) => (
                      <li className="order-item" key={`${item.productName}-${index}`}>
                        <span>
                          <strong>{item.productName}</strong>
                          <span className="order-item-quantity">
                            {item.quantity} × {formatPrice(item.price)}
                          </span>
                        </span>
                        <strong>{formatPrice(item.subtotal)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="order-items-unavailable">
                    Product details were not included with this order.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Orders