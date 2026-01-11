import { useState } from 'react';
import { checkShoppingItem, clearShoppingList } from '../api/client';

export function ShoppingMode({ shoppingItems, onRefresh }) {
  const [showClearModal, setShowClearModal] = useState(false);

  const sortedItems = [...shoppingItems].sort((a, b) => {
    // Unchecked first
    if (a.is_checked !== b.is_checked) {
      return a.is_checked ? 1 : -1;
    }
    // Then by product sort order
    const aOrder = a.product_sort_order ?? 999999;
    const bOrder = b.product_sort_order ?? 999999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Custom items by their sort_order
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const checkedCount = shoppingItems.filter(i => i.is_checked).length;
  const totalCount = shoppingItems.length;

  const handleCheck = async (item) => {
    try {
      await checkShoppingItem(item.id, !item.is_checked);
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleClear = async (keepUnchecked) => {
    try {
      await clearShoppingList(keepUnchecked);
      setShowClearModal(false);
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  if (shoppingItems.length === 0) {
    return (
      <div>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Tryb zakupow</h2>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Brak produktow na liscie</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Dodaj produkty w zakladce "Lista"</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 16 }}>Tryb zakupow</h2>

      <div className="summary">
        <div className="summary-row">
          <span>Kupione:</span>
          <strong>{checkedCount} / {totalCount}</strong>
        </div>
        {checkedCount === totalCount && totalCount > 0 && (
          <div style={{ textAlign: 'center', marginTop: 8, color: 'var(--success)' }}>
            Wszystko kupione!
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-secondary"
          onClick={() => setShowClearModal(true)}
        >
          Zakoncz zakupy
        </button>
      </div>

      {sortedItems.map(item => (
        <div
          key={item.id}
          className={`shopping-item ${item.is_checked ? 'checked' : ''}`}
          onClick={() => handleCheck(item)}
          style={{ cursor: 'pointer' }}
        >
          <div className={`shopping-checkbox ${item.is_checked ? 'checked' : ''}`}>
            {item.is_checked && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <div className="item-content">
            <div className="item-name">
              {item.product_name || item.custom_name}
              {!item.product_id && <span className="custom-badge">spoza bazy</span>}
            </div>
            <div className="item-details">
              {item.quantity && <span className="item-quantity">{item.quantity}</span>}
              {item.note && <div className="item-note">{item.note}</div>}
            </div>
          </div>
        </div>
      ))}

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Zakoncz zakupy</h2>
            {checkedCount < totalCount ? (
              <p>
                Nie wszystkie produkty zostaly kupione ({totalCount - checkedCount} pozostalo).
                Co chcesz zrobic?
              </p>
            ) : (
              <p>Wszystkie produkty kupione. Wyczysc liste?</p>
            )}
            <div className="modal-actions" style={{ flexDirection: 'column' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleClear(false)}
              >
                Wyczysc cala liste
              </button>
              {checkedCount < totalCount && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleClear(true)}
                >
                  Zostaw niekupione
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowClearModal(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
