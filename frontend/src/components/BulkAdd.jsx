import { useState } from 'react';
import { addToShoppingList, deleteShoppingItem, updateShoppingItem } from '../api/client';

export function BulkAdd({ products, shoppingItems, onRefresh }) {
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState({});

  // Map product_id to shopping item
  const shoppingMap = {};
  shoppingItems.forEach(item => {
    if (item.product_id) {
      shoppingMap[item.product_id] = item;
    }
  });

  const handleToggle = async (product) => {
    const existingItem = shoppingMap[product.id];
    setLoading(prev => ({ ...prev, [product.id]: true }));

    try {
      if (existingItem) {
        // Remove from shopping list
        await deleteShoppingItem(existingItem.id);
        setQuantities(prev => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      } else {
        // Add to shopping list
        await addToShoppingList({
          product_id: product.id,
          quantity: quantities[product.id] || null,
        });
      }
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleQuantityChange = (productId, value) => {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const handleQuantityBlur = async (product) => {
    const existingItem = shoppingMap[product.id];
    if (existingItem && quantities[product.id] !== undefined) {
      try {
        await updateShoppingItem(existingItem.id, {
          quantity: quantities[product.id] || null,
        });
        onRefresh();
      } catch (err) {
        alert('Blad: ' + err.message);
      }
    }
  };

  const checkedCount = products.filter(p => shoppingMap[p.id]).length;

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 16 }}>Uzupelnij liste</h2>

      <div className="summary">
        <div className="summary-row">
          <span>Zaznaczono:</span>
          <strong>{checkedCount} / {products.length}</strong>
        </div>
      </div>

      <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
        Przejdz sie po mieszkaniu i zaznacz produkty, ktore sie koncza
      </p>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Brak produktow w bazie</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Dodaj produkty w zakladce "Produkty"</p>
        </div>
      ) : (
        products.map(product => {
          const existingItem = shoppingMap[product.id];
          const isChecked = !!existingItem;
          const isLoading = loading[product.id];
          const currentQuantity = quantities[product.id] ?? existingItem?.quantity ?? '';

          return (
            <div
              key={product.id}
              className={`shopping-item ${isChecked ? '' : 'unchecked-bulk'}`}
              style={{ opacity: isLoading ? 0.5 : 1 }}
            >
              <div
                className={`shopping-checkbox ${isChecked ? 'checked' : ''}`}
                onClick={() => !isLoading && handleToggle(product)}
              >
                {isChecked && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
              <div className="item-content" style={{ flex: 1 }}>
                <div className="item-name">{product.name}</div>
              </div>
              <input
                type="text"
                placeholder="Ilosc"
                value={currentQuantity}
                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                onBlur={() => handleQuantityBlur(product)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 80,
                  padding: '6px 8px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius)',
                  fontSize: 14,
                }}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
