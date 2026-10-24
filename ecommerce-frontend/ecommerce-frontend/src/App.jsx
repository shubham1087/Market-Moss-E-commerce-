import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AdminProducts from './pages/AdminProducts.jsx'
import Orders from './pages/Orders.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Products from './pages/Products.jsx'
import Register from './pages/Register.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import ShoppingAssistant from './components/ShoppingAssistant.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import CartProvider from './context/CartContext.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app-shell">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route
                  path="/admin/products"
                  element={<AdminRoute><AdminProducts /></AdminRoute>}
                />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/checkout"
                  element={<ProtectedRoute><Checkout /></ProtectedRoute>}
                />
                <Route
                  path="/orders"
                  element={<ProtectedRoute><Orders /></ProtectedRoute>}
                />
              </Routes>
            </main>
            <Footer />
            <ShoppingAssistant />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
