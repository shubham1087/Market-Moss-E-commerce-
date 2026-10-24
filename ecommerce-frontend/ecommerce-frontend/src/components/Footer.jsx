import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="footer-brand" to="/">Market & Moss</Link>
        <p>Thoughtful finds for everyday living.</p>
        <span className="footer-note">© {new Date().getFullYear()} Market & Moss</span>
      </div>
    </footer>
  )
}

export default Footer