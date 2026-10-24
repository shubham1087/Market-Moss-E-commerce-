import { useParams } from 'react-router-dom'

function ProductDetails() {
  const { id } = useParams()

  return (
    <section className="page">
      <p className="eyebrow">Product</p>
      <h1>Product details</h1>
      <p className="page-intro">Product {id} details will appear here when the catalog is connected.</p>
    </section>
  )
}

export default ProductDetails