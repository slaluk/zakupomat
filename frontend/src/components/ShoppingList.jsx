import { useState } from 'react';
import { ProductSearch } from './ProductSearch';
import {
  addToShoppingList,
  updateShoppingItem,
  deleteShoppingItem,
} from '../api/client';

export function ShoppingList({ products, shoppingItems, onRefresh }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const sortedItems = [...shoppingItems].sort((a, b) => {
    return (a.product_sort_order ?? 999999) - (b.product_sort_order ?? 999999);
  });

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCustomName('');
  };

  const handleAddCustom = (name) => {
    setCustomName(name);
    setSelectedProduct(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedProduct) {
        await addToShoppingList({
          product_id: selectedProduct.id,
          quantity: quantity || null,
          note: note || null,
        });
      } else if (customName) {
        await addToShoppingList({
          custom_name: customName,
          quantity: quantity || null,
          note: note || null,
        });
      }
      setSelectedProduct(null);
      setCustomName('');
      setQuantity('');
      setNote('');
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Usunac produkt z listy?')) return;
    try {
      await deleteShoppingItem(id);
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem({
      ...item,
      quantity: item.quantity || '',
      note: item.note || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateShoppingItem(editingItem.id, {
        quantity: editingItem.quantity || null,
        note: editingItem.note || null,
      });
      setEditingItem(null);
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 16 }}>Lista zakupow</h2>

      <ProductSearch
        products={products}
        shoppingItems={shoppingItems}
        onSelect={handleSelectProduct}
        onAddCustom={handleAddCustom}
      />

      {(selectedProduct || customName) && (
        <div className="add-form">
          <strong>
            {selectedProduct ? selectedProduct.name : customName}
          </strong>
          {!selectedProduct && (
            <span style={{ fontSize: 12, color: 'var(--gray-500)', marginLeft: 8 }}>
              (nowy produkt)
            </span>
          )}
          <div className="add-form-row">
            <input
              type="text"
              placeholder="Ilosc (np. 2 kg)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              type="text"
              placeholder="Notatka"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="add-form-row">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => {
                setSelectedProduct(null);
                setCustomName('');
                setQuantity('');
                setNote('');
              }}
            >
              Anuluj
            </button>
            <button className="btn btn-primary btn-small" onClick={handleSubmit}>
              Dodaj do listy
            </button>
          </div>
        </div>
      )}

      {sortedItems.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Lista zakupow jest pusta</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Wyszukaj produkty powyzej</p>
        </div>
      ) : (
        sortedItems.map(item => (
          <div key={item.id} className="shopping-item">
            <div className="item-content">
              <div className="item-name">
                {item.product_name}
              </div>
              {editingItem?.id === item.id ? (
                <div className="add-form-row" style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Ilosc"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Notatka"
                    value={editingItem.note}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  />
                  <button className="btn btn-primary btn-small" onClick={handleSaveEdit}>
                    OK
                  </button>
                </div>
              ) : (
                <div className="item-details">
                  {item.quantity && <span className="item-quantity">{item.quantity}</span>}
                  {item.note && <div className="item-note">{item.note}</div>}
                </div>
              )}
            </div>
            <div className="item-actions">
              <button className="btn-icon" onClick={() => handleEdit(item)} title="Edytuj">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Usun">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
