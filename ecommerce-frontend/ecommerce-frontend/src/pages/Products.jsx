import { useEffect, useState } from 'react'
import Loading from '../components/Loading.jsx'
import ProductCard from '../components/ProductCard.jsx'
import api from '../services/api.js'

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      try {
        const response = await api.get('/products', { signal: controller.signal })

        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected products response')
        }

        setProducts(response.data)
      } catch {
        if (!controller.signal.aborted) {
          setError('Unable to load products. Please try again later.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => controller.abort()
  }, [])

  return (
    <section className="page">
      <p className="eyebrow">The collection</p>
      <h1>Shop all</h1>
      <p className="page-intro">Browse the pieces in our collection.</p>

      {loading && <Loading />}
      {!loading && error && <p className="error-state" role="alert">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="empty-state">No products available.</p>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

export default Products