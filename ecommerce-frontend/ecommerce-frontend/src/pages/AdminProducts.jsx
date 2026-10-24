import { useCallback, useEffect, useRef, useState } from 'react'
import Loading from '../components/Loading.jsx'
import api from '../services/api.js'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  quantity: '',
  categoryId: '',
  imageUrl: '',
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error.message
    || fallback
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const imageInputRef = useRef(null)
  const [editingId, setEditingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const loadProducts = useCallback(async () => {
    const { data } = await api.get('/products')
    if (!Array.isArray(data)) {
      throw new Error('The product service returned an unexpected response.')
    }
    setProducts(data)
  }, [])

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setLoadError('')
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ])

        if (!Array.isArray(productResponse.data) || !Array.isArray(categoryResponse.data)) {
          throw new Error('The catalog service returned an unexpected response.')
        }

        if (active) {
          setProducts(productResponse.data)
          setCategories(categoryResponse.data)
        }
      } catch (error) {
        if (active) {
          setLoadError(getErrorMessage(error, 'Unable to load the product catalog.'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [reloadKey])

  const refreshProducts = async () => {
    try {
      await loadProducts()
      setLoadError('')
    } catch (error) {
      setLoadError(getErrorMessage(error, 'The change was saved, but the product list could not be refreshed.'))
    }
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
    setSuccessMessage('')
  }

  function clearSelectedImage() {
    setSelectedImage(null)
    setImagePreview('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function startEditing(product) {
    setEditingId(product.id)
    clearSelectedImage()
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      quantity: String(product.quantity ?? ''),
      categoryId: String(product.category?.id ?? ''),
      imageUrl: product.imageUrl ?? '',
    })
    setFormErrors({})
    setFormError('')
    setSuccessMessage('')
    document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function resetForm() {
    setForm(emptyForm)
    clearSelectedImage()
    setEditingId(null)
    setFormErrors({})
    setFormError('')
    setSuccessMessage('')
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0] ?? null
    setFormError('')
    setSuccessMessage('')

    if (file && !file.type.startsWith('image/')) {
      clearSelectedImage()
      setFormErrors((current) => ({ ...current, image: 'Choose a valid image file.' }))
      event.target.value = ''
      return
    }

    setSelectedImage(file)
    setImagePreview(file ? URL.createObjectURL(file) : '')
    setFormErrors((current) => ({ ...current, image: '' }))
  }

  function validateForm() {
    const errors = {}
    const price = Number(form.price)
    const quantity = Number(form.quantity)

    if (!form.name.trim()) errors.name = 'Product name is required.'
    if (!form.description.trim()) errors.description = 'Description is required.'
    if (!form.price.trim() || !Number.isFinite(price) || price <= 0) {
      errors.price = 'Enter a price greater than zero.'
    }
    if (!form.quantity.trim() || !Number.isInteger(quantity) || quantity < 0) {
      errors.quantity = 'Stock must be a whole number of zero or more.'
    }
    if (!form.categoryId || !categories.some((category) => category.id === Number(form.categoryId))) {
      errors.categoryId = 'Choose a valid category.'
    }
    if (!selectedImage && !form.imageUrl.trim()) errors.image = 'Choose a product image.'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!validateForm()) return

    if (selectedImage) {
      setFormError(
        'This image is only previewed and has not been uploaded. The backend currently accepts imageUrl text and does not provide a verified file-upload endpoint, so the product was not submitted. Backend image-upload support is required before a selected file can be saved.',
      )
      return
    }

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
      imageUrl: form.imageUrl.trim(),
      categoryId: Number(form.categoryId),
    }

    setIsSubmitting(true)
    try {
      if (editingId === null) {
        await api.post('/products', productData)
        setSuccessMessage('Product created successfully.')
      } else {
        await api.put(`/products/${editingId}`, productData)
        setSuccessMessage('Product updated successfully.')
      }

      setForm(emptyForm)
      clearSelectedImage()
      setEditingId(null)
      setFormErrors({})
      await refreshProducts()
    } catch (error) {
      const authorizationMessage = error.response?.status === 401
        ? 'The backend rejected this request because your session is not authorized. Please sign in again with an ADMIN account.'
        : error.response?.status === 403
          ? 'The backend rejected this request. Product creation requires an ADMIN account.'
          : ''
      setFormError(authorizationMessage || getErrorMessage(error, 'Unable to save this product. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`)
    if (!confirmed) return

    setActionError('')
    setSuccessMessage('')
    setDeletingId(product.id)
    try {
      await api.delete(`/products/${product.id}`)
      setSuccessMessage(`"${product.name}" was deleted.`)
      await refreshProducts()
    } catch (error) {
      const authorizationMessage = error.response?.status === 401
        ? 'The backend rejected this request because your session is not authorized. Please sign in again with an ADMIN account.'
        : error.response?.status === 403
          ? 'The backend rejected this request. Product deletion requires an ADMIN account.'
          : ''
      setActionError(authorizationMessage || getErrorMessage(
        error,
        'Unable to delete this product. It may be referenced by existing orders.',
      ))
    } finally {
      setDeletingId(null)
    }
  }

  const formattedPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(price)

  return (
    <section className="page admin-page">
      <p className="eyebrow">Market & Moss · Admin</p>
      <div className="admin-heading">
        <div>
          <h1>Products</h1>
          <p className="page-intro">Manage the products shown in your shop.</p>
        </div>
        <button
          className="button-primary"
          type="button"
          onClick={() => {
            resetForm()
            document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Add Product
        </button>
      </div>

      {successMessage && <p className="admin-notice success" role="status">{successMessage}</p>}
      {actionError && <p className="admin-notice error" role="alert">{actionError}</p>}
      {loadError && <p className="admin-notice error" role="alert">{loadError}</p>}

      <section className="admin-panel" aria-labelledby="product-list-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2 id="product-list-heading">All products</h2>
          </div>
          {!loading && <span className="admin-count">{products.length} products</span>}
        </div>

        {loading && <Loading />}
        {!loading && loadError && (
          <button
            className="button-secondary"
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Try again
          </button>
        )}
        {!loading && !loadError && products.length === 0 && (
          <p className="empty-state">No products yet. Add your first product below.</p>
        )}
        {!loading && !loadError && products.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <img
                          className="admin-product-image"
                          src={product.imageUrl || ''}
                          alt=""
                        />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>{product.category?.name || 'Uncategorized'}</td>
                    <td>{formattedPrice(product.price)}</td>
                    <td>{product.quantity}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="button-secondary" type="button" onClick={() => startEditing(product)}>
                          Edit
                        </button>
                        <button
                          className="button-danger"
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-panel admin-form-panel" id="admin-product-form" aria-labelledby="admin-form-heading">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">{editingId === null ? 'New listing' : 'Update listing'}</p>
            <h2 id="admin-form-heading">{editingId === null ? 'Add a product' : 'Edit product'}</h2>
          </div>
          {editingId !== null && (
            <button className="button-secondary" type="button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <form className="admin-product-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-form-fields">
            <div className="admin-field admin-field-wide">
              <label htmlFor="admin-product-name">Product name</label>
              <input
                id="admin-product-name"
                name="name"
                value={form.name}
                onChange={updateForm}
                required
                aria-invalid={Boolean(formErrors.name)}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="admin-field admin-field-wide">
              <label htmlFor="admin-product-description">Description</label>
              <textarea
                id="admin-product-description"
                name="description"
                rows="4"
                value={form.description}
                onChange={updateForm}
                required
                aria-invalid={Boolean(formErrors.description)}
              />
              {formErrors.description && <span className="field-error">{formErrors.description}</span>}
            </div>

            <div className="admin-field">
              <label htmlFor="admin-product-price">Price (INR)</label>
              <input
                id="admin-product-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={updateForm}
                required
                aria-invalid={Boolean(formErrors.price)}
              />
              {formErrors.price && <span className="field-error">{formErrors.price}</span>}
            </div>

            <div className="admin-field">
              <label htmlFor="admin-product-quantity">Stock quantity</label>
              <input
                id="admin-product-quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={updateForm}
                required
                aria-invalid={Boolean(formErrors.quantity)}
              />
              {formErrors.quantity && <span className="field-error">{formErrors.quantity}</span>}
            </div>

            <div className="admin-field">
              <label htmlFor="admin-product-category">Category</label>
              <select
                id="admin-product-category"
                name="categoryId"
                value={form.categoryId}
                onChange={updateForm}
                required
                aria-invalid={Boolean(formErrors.categoryId)}
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {formErrors.categoryId && <span className="field-error">{formErrors.categoryId}</span>}
            </div>

            <div className="admin-field admin-field-wide">
              <label htmlFor="admin-product-image-file">Product image</label>
              <input
                id="admin-product-image-file"
                name="imageFile"
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
              />
              <span className="admin-field-hint">
                The image is previewed locally. Saving the selected file requires image-upload support in the backend.
              </span>
              {imagePreview && (
                <div className="admin-image-preview">
                  <img
                    key={imagePreview}
                    src={imagePreview}
                    alt="Selected product image preview"
                  />
                </div>
              )}
              {formErrors.image && <span className="field-error">{formErrors.image}</span>}
            </div>
          </div>

          {formError && <p className="admin-notice error" role="alert">{formError}</p>}
          <div className="admin-form-actions">
            <button className="button-primary" type="submit" disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? 'Saving...' : editingId === null ? 'Add Product' : 'Save changes'}
            </button>
            {categories.length === 0 && (
              <p className="field-error">Products cannot be saved until a category is available.</p>
            )}
          </div>
        </form>
      </section>
    </section>
  )
}

export default AdminProducts
