import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="hero">
      <p className="eyebrow">A considered collection</p>
      <h1>Good things, made for everyday.</h1>
      <p className="hero-copy">
        Find useful, lasting pieces for the spaces and rituals that make a place feel like yours.
      </p>
      <Link className="primary-link" to="/products">Explore the collection <span aria-hidden="true">&nbsp;→</span></Link>
    </section>
  )
}

export default Home