import { useState, useRef, useEffect } from 'react';

export function ProductSearch({ products, shoppingItems, onSelect, onAddCustom, onSearchChange }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  const updateQuery = (value) => {
    setQuery(value);
    if (onSearchChange) onSearchChange(value);
  };

  const existingProductIds = new Set(
    shoppingItems
      .filter(item => item.product_id)
      .map(item => item.product_id)
  );

  const filteredProducts = products
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      !existingProductIds.has(p.id)
    )
    .slice(0, 10);

  const exactMatch = products.some(
    p => p.name.toLowerCase() === query.toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product) => {
    onSelect(product);
    updateQuery('');
    setShowResults(false);
  };

  const handleAddCustom = () => {
    if (query.trim()) {
      onAddCustom(query.trim());
      updateQuery('');
      setShowResults(false);
    }
  };

  const handleClear = () => {
    updateQuery('');
    setShowResults(false);
  };

  return (
    <div className="search-container" ref={containerRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Wyszukaj produkt..."
        value={query}
        onChange={(e) => {
          updateQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
      />
      {query && (
        <button
          className="search-clear-btn"
          onClick={handleClear}
          type="button"
          aria-label="Wyczysc wyszukiwanie"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {showResults && query.trim() && (
        <div className="search-results">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="search-result-item"
              onClick={() => handleSelect(product)}
            >
              {product.name}
            </div>
          ))}

          {!exactMatch && query.trim() && (
            <div
              className="search-result-item search-result-new"
              onClick={handleAddCustom}
            >
              + Dodaj "{query}" (nowy produkt)
            </div>
          )}

          {filteredProducts.length === 0 && exactMatch && (
            <div className="search-result-item" style={{ color: '#666' }}>
              Ten produkt jest juz na liscie
            </div>
          )}
        </div>
      )}
    </div>
  );
}
