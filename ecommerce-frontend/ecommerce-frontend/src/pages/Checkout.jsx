import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import useCart from '../hooks/useCart.js'
import api from '../services/api.js'

const formatPrice = (amount) => new Intl.NumberFormat('en-IN', {
 style: 'currency',
 currency: 'INR',
 maximumFractionDigits: 2,
}).format(amount)

function Checkout() {
 const { user } = useAuth()
 const { items, subtotal, clearCart } = useCart()
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submitError, setSubmitError] = useState('')
 const [orderConfirmation, setOrderConfirmation] = useState(null)

 const handlePlaceOrder = async () => {
   if (!items.length) {
     setSubmitError('Your bag is empty. Add an item before checkout.')
     return
   }

   setIsSubmitting(true)
   setSubmitError('')

   try {
     const payload = {
       userId: user.userId,
       items: items.map(({ id, cartQuantity }) => ({
         productId: id,
         quantity: cartQuantity,
       })),
     }

     const response = await api.post('/orders', payload)
     const createdOrder = response.data

     setOrderConfirmation(createdOrder)
     clearCart()
   } catch (error) {
     const message = error?.response?.data?.message
       || 'Your order could not be placed right now. Please try again.'
     setSubmitError(message)
   } finally {
     setIsSubmitting(false)
   }
 }

 if (orderConfirmation) {
   return (
     <section className="page">
       <p className="eyebrow">Order confirmed</p>
       <h1>Thank you</h1>
       <p className="page-intro">
         Your order #{orderConfirmation.orderId} was placed successfully.
       </p>
       <p className="page-intro">
         Total: <strong>{formatPrice(orderConfirmation.totalAmount)}</strong>
       </p>
       <Link className="primary-link checkout-back-link" to="/products">Continue shopping <span aria-hidden="true">&nbsp;→</span></Link>
     </section>
   )
 }

 return (
   <section className="page">
     <p className="eyebrow">Almost yours</p>
     <h1>Checkout</h1>
     {items.length === 0 ? (
       <>
         <p className="page-intro">Your bag is empty. Add something before checkout.</p>
         <Link className="primary-link checkout-back-link" to="/products">Continue shopping <span aria-hidden="true">&nbsp;→</span></Link>
       </>
     ) : (
       <>
         <p className="page-intro">Review your bag before placing an order.</p>
         <div className="checkout-review">
           {items.map((item) => (
             <div className="summary-line" key={item.id}>
               <span>{item.name} × {item.cartQuantity}</span>
               <strong>{formatPrice(item.price * item.cartQuantity)}</strong>
             </div>
           ))}
           <div className="summary-line checkout-total">
             <span>Total</span>
             <strong>{formatPrice(subtotal)}</strong>
           </div>
         </div>

         <div className="cart-controls" style={{ marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
           <button
             type="button"
             className="button-primary"
             onClick={handlePlaceOrder}
             disabled={isSubmitting}
           >
             {isSubmitting ? 'Placing order...' : 'Place order'}
           </button>
           <Link className="continue-link checkout-back-link" to="/cart">Return to your bag</Link>
         </div>

         {submitError && (
           <p className="error-state checkout-unavailable" role="alert">
             {submitError}
           </p>
         )}
       </>
     )}
   </section>
 )
}

export default Checkout