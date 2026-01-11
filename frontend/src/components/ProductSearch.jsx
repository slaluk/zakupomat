import { useState, useRef, useEffect } from 'react';

export function ProductSearch({ products, shoppingItems, onSelect, onAddCustom }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

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
    setQuery('');
    setShowResults(false);
  };

  const handleAddCustom = () => {
    if (query.trim()) {
      onAddCustom(query.trim());
      setQuery('');
      setShowResults(false);
    }
  };

  return (
    <div className="search-container" ref={containerRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Wyszukaj produkt..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
      />

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
