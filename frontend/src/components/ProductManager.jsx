import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  getAccessKey,
} from '../api/client';

function SortableProduct({ product, onEdit, onDelete, shoppingItems }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOnList = shoppingItems.some(item => item.product_id === product.id);

  return (
    <div ref={setNodeRef} style={style} className="product-item">
      <div className="drag-handle" {...attributes} {...listeners}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm8-12a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <span className="product-name">{product.name}</span>
      <span className="product-order">#{product.sort_order}</span>
      <button className="btn-icon" onClick={() => onEdit(product)} title="Edytuj">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        className="btn-icon"
        onClick={() => onDelete(product)}
        title={isOnList ? 'Produkt jest na liscie' : 'Usun'}
        disabled={isOnList}
        style={{ opacity: isOnList ? 0.3 : 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}

export function ProductManager({ products, shoppingItems, onRefresh }) {
  const [newProductName, setNewProductName] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [items, setItems] = useState(products);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Update local items when products prop changes
  if (products.length !== items.length ||
      products.some((p, i) => p.id !== items[i]?.id)) {
    setItems(products);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(p => p.id === active.id);
      const newIndex = items.findIndex(p => p.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        await reorderProducts(newItems.map(p => p.id));
        onRefresh();
      } catch (err) {
        alert('Blad: ' + err.message);
        setItems(products);
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    try {
      await createProduct(newProductName.trim());
      setNewProductName('');
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Usunac produkt "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct.name.trim()) return;
    try {
      await updateProduct(editingProduct.id, editingProduct.name.trim());
      setEditingProduct(null);
      onRefresh();
    } catch (err) {
      alert('Blad: ' + err.message);
    }
  };

  const handleShareLink = async () => {
    try {
      const accessKey = getAccessKey();
      if (!accessKey) {
        alert('Brak klucza dostepu');
        return;
      }

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/?key=${encodeURIComponent(accessKey)}`;

      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      alert('Nie udalo sie skopiowac linku');
    }
  };

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 16 }}>Baza produktow</h2>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-secondary btn-small"
          onClick={handleShareLink}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" />
            <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" />
            <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" />
            <path d="M8.59 13.51L15.42 17.49" />
            <path d="M15.41 6.51L8.59 10.49" />
          </svg>
          Udostepnij dostep
        </button>
        {showCopiedMessage && (
          <span style={{ color: 'var(--success)', fontSize: 14, fontWeight: 500 }}>
            Link skopiowany!
          </span>
        )}
      </div>

      <form className="add-form" onSubmit={handleAddProduct}>
        <div className="add-form-row" style={{ marginTop: 0 }}>
          <input
            type="text"
            placeholder="Nazwa nowego produktu"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-small">
            Dodaj
          </button>
        </div>
      </form>

      <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
        Przeciagnij produkty, aby ustawic kolejnosc wg polozenia w sklepie
      </p>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Brak produktow w bazie</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Dodaj produkty powyzej</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {items.map(product => (
              <SortableProduct
                key={product.id}
                product={product}
                onEdit={setEditingProduct}
                onDelete={handleDelete}
                shoppingItems={shoppingItems}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edytuj produkt</h2>
            <input
              type="text"
              value={editingProduct.name}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)' }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingProduct(null)}>
                Anuluj
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
