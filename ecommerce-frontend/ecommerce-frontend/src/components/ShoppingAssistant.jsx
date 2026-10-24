import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useCart from '../hooks/useCart.js'
import api from '../services/api.js'
import './ShoppingAssistant.css'

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your Market & Moss shopping assistant. Tell me what you're looking for, and I'll help you find the right product.",
}

const suggestedPrompts = [
  'Recommend products under ₹2,000',
  'Show products from a specific category',
  'Help me compare products',
  'Recommend products for daily use',
]

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(price)

function isProduct(product) {
  return product
    && Number.isInteger(product.id)
    && typeof product.name === 'string'
    && Number.isFinite(product.price)
    && Number.isInteger(product.quantity)
}

function ShoppingAssistant() {
  const { addToCart, items } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([welcomeMessage])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [failedRequest, setFailedRequest] = useState(null)
  const [cartFeedback, setCartFeedback] = useState({})
  const toggleButtonRef = useRef(null)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messageIdRef = useRef(0)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    } else if (wasOpenRef.current) {
      toggleButtonRef.current?.focus()
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading, chatError])

  async function sendRequest(request) {
    if (isLoading) return

    setIsLoading(true)
    setChatError('')
    setFailedRequest(null)

    try {
      const { data } = await api.post('/chat', request)
      if (
        !data
        || typeof data.reply !== 'string'
        || !Array.isArray(data.recommendedProducts)
      ) {
        throw new Error('The shopping assistant returned an unexpected response.')
      }

      const assistantMessage = {
        id: `message-${++messageIdRef.current}`,
        role: 'assistant',
        content: data.reply,
        products: data.recommendedProducts.filter(isProduct),
      }
      setMessages((currentMessages) => [...currentMessages, assistantMessage])
    } catch (error) {
      setChatError(
        error?.response?.data?.message
          || error.message
          || 'Unable to reach the shopping assistant. Please try again.',
      )
      setFailedRequest(request)
    } finally {
      setIsLoading(false)
    }
  }

  function sendMessage(messageText) {
    const message = messageText.trim()
    if (!message || isLoading) return

    const conversationHistory = messages
      .filter((entry) => entry.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }))
      .slice(-12)

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `message-${++messageIdRef.current}`,
        role: 'user',
        content: message,
      },
    ])
    setDraft('')
    sendRequest({ message, conversationHistory })
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
  }

  function handleInputKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function addProductToCart(product) {
    const result = addToCart(product)
    setCartFeedback((current) => ({
      ...current,
      [product.id]: result,
    }))
  }

  return (
    <div className="shopping-assistant">
      {isOpen && (
        <section
          className="assistant-window"
          role="dialog"
          aria-labelledby="assistant-title"
          aria-describedby="assistant-description"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false)
          }}
        >
          <header className="assistant-header">
            <div className="assistant-brand">
              <span className="assistant-mark" aria-hidden="true">M</span>
              <div>
                <h2 id="assistant-title">Market &amp; Moss</h2>
                <p id="assistant-description">Shopping assistant</p>
              </div>
            </div>
            <button
              className="assistant-close"
              type="button"
              aria-label="Close shopping assistant"
              onClick={() => setIsOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <article className={`assistant-message ${message.role}`} key={message.id}>
                <p className="assistant-message-content">{message.content}</p>
                {message.products?.length > 0 && (
                  <div className="assistant-products" aria-label="Recommended products">
                    {message.products.map((product) => {
                      const cartQuantity = items.find((item) => item.id === product.id)?.cartQuantity ?? 0
                      const unavailable = product.quantity <= cartQuantity
                      const feedback = cartFeedback[product.id]

                      return (
                        <article className="assistant-product-card" key={product.id}>
                          <div className="assistant-product-image-wrap">
                            {product.imageUrl ? (
                              <img
                                className="assistant-product-image"
                                src={product.imageUrl}
                                alt={product.name}
                                onError={(event) => {
                                  event.currentTarget.hidden = true
                                  event.currentTarget.nextElementSibling.hidden = false
                                }}
                              />
                            ) : null}
                            <span
                              className="assistant-image-fallback"
                              aria-hidden="true"
                              hidden={Boolean(product.imageUrl)}
                            >
                              Image unavailable
                            </span>
                          </div>
                          <div className="assistant-product-details">
                            <h3>{product.name}</h3>
                            <p className="assistant-product-price">{formatPrice(product.price)}</p>
                            <p className={product.quantity > 0 ? 'assistant-stock' : 'assistant-stock out-of-stock'}>
                              {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}
                            </p>
                            <div className="assistant-product-actions">
                              <Link className="assistant-view-product" to={`/products/${product.id}`}>
                                View Product
                              </Link>
                              <button
                                className="assistant-add-button"
                                type="button"
                                onClick={() => addProductToCart(product)}
                                disabled={unavailable}
                              >
                                {unavailable ? 'Unavailable' : 'Add to Bag'}
                              </button>
                            </div>
                            {feedback && (
                              <p
                                className={feedback.success ? 'assistant-cart-feedback' : 'assistant-cart-feedback error'}
                                role={feedback.success ? 'status' : 'alert'}
                              >
                                {feedback.message}
                              </p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </article>
            ))}

            {messages.length === 1 && !isLoading && (
              <div className="assistant-suggestions" aria-label="Suggested messages">
                {suggestedPrompts.map((prompt) => (
                  <button
                    className="assistant-suggestion"
                    type="button"
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="assistant-typing" role="status" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            )}

            {chatError && (
              <div className="assistant-error" role="alert">
                <p>{chatError}</p>
                {failedRequest && (
                  <button
                    className="assistant-retry"
                    type="button"
                    onClick={() => sendRequest(failedRequest)}
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="assistant-sr-only" htmlFor="assistant-input">Message the shopping assistant</label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              value={draft}
              maxLength={2000}
              rows={1}
              placeholder="Ask about products..."
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isLoading}
            />
            <button
              className="assistant-send"
              type="submit"
              aria-label="Send message"
              disabled={isLoading || !draft.trim()}
            >
              <span aria-hidden="true">↑</span>
            </button>
            <p className="assistant-composer-hint">Enter to send · Shift+Enter for a new line</p>
          </form>
        </section>
      )}

      <button
        className="assistant-toggle"
        type="button"
        ref={toggleButtonRef}
        aria-label={isOpen ? 'Close shopping assistant' : 'Open shopping assistant'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <span aria-hidden="true">×</span> : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" />
              <path d="M8 11h8M8 14h5" />
            </svg>
            <span>Ask Moss</span>
          </>
        )}
      </button>
    </div>
  )
}

export default ShoppingAssistant
