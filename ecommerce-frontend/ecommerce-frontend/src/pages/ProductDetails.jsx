import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import useCart from '../hooks/useCart.js'
import api from '../services/api.js'

function ProductDetails() {
  const { id } = useParams()
  const { items, addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [status, setStatus] = useState('loading')
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProduct() {
      setStatus('loading')
      setProduct(null)
      setFeedback(null)

      try {
        const response = await api.get('/products', { signal: controller.signal })
        const data = response.data

        if (!Array.isArray(data)) {
          throw new Error('The product service returned an unexpected response.')
        }

        const matchingProduct = data.find((item) => String(item.id) === id)
        if (!matchingProduct) {
          setStatus('not-found')
          return
        }

        setProduct(matchingProduct)
        setQuantity(1)
        setStatus('ready')
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus(error.response?.status === 404 ? 'not-found' : 'error')
        }
      }
    }

    loadProduct()
    return () => controller.abort()
  }, [id, reloadKey])

  const cartQuantity = items.find((item) => item.id === product?.id)?.cartQuantity ?? 0
  const availableToAdd = product ? Math.max(0, product.quantity - cartQuantity) : 0
  const selectedQuantity = Math.min(quantity, Math.max(availableToAdd, 1))
  const price = product && new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(product.price)

  function handleAddToBag() {
    const result = addToCart(product, selectedQuantity)
    setFeedback(result)
  }

  return (
    <section className="page product-details-page">
      <Link className="product-back-link" to="/products">← Back to Products</Link>

      {status === 'loading' && <Loading />}

      {status === 'not-found' && (
        <div className="product-state">
          <p className="eyebrow">Product unavailable</p>
          <h1>We couldn’t find that product.</h1>
          <p className="page-intro">It may have been removed from the collection.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="product-state" role="alert">
          <p className="eyebrow">Catalog error</p>
          <h1>Product details couldn’t load.</h1>
          <p className="page-intro">Please check your connection and try again.</p>
          <button className="button-primary product-retry-button" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && product && (
        <div className="product-details-layout">
          <div className="product-details-media">
            {product.imageUrl ? (
              <img className="product-details-image" src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="product-details-image-placeholder" role="img" aria-label={`No image available for ${product.name}`} />
            )}
          </div>

          <div className="product-details-copy">
            <p className="eyebrow">{product.category?.name || 'Uncategorized'}</p>
            <h1>{product.name}</h1>
            <p className="product-details-price">{price}</p>
            <p className="product-details-description">{product.description}</p>

            <p className="product-stock" aria-live="polite">
              {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}
            </p>

            <div className="product-purchase-row">
              <label className="product-quantity-field" htmlFor="product-quantity">
                Quantity
                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  max={Math.max(availableToAdd, 1)}
                  step="1"
                  value={selectedQuantity}
                  disabled={availableToAdd === 0}
                  onChange={(event) => {
                    const nextQuantity = event.target.valueAsNumber
                    if (Number.isInteger(nextQuantity)) {
                      setQuantity(Math.max(1, Math.min(nextQuantity, availableToAdd)))
                    }
                  }}
                />
              </label>
              <button
                className="button-primary product-add-button"
                type="button"
                onClick={handleAddToBag}
                disabled={availableToAdd === 0}
              >
                {availableToAdd === 0 ? 'Out of Stock' : 'Add to Bag'}
              </button>
            </div>

            {feedback && (
              <p className={feedback.success ? 'cart-feedback' : 'cart-feedback error'} role={feedback.success ? 'status' : 'alert'}>
                {feedback.message}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default ProductDetails