import { Link } from 'react-router-dom'

function BrandMark({ compact = false }) {
  return (
    <Link className={`brand-mark${compact ? ' brand-mark--compact' : ''}`} to="/" aria-label="Web Rush home">
      <span className="brand-mark__icon" aria-hidden="true">
        WR
      </span>
      <span className="brand-mark__name">WEB RUSH</span>
    </Link>
  )
}

export default BrandMark
