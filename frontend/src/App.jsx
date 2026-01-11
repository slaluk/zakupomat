import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';

import { Login } from './components/Login';
import { BottomNav } from './components/BottomNav';
import { ShoppingList } from './components/ShoppingList';
import { ShoppingMode } from './components/ShoppingMode';
import { BulkAdd } from './components/BulkAdd';
import { ProductManager } from './components/ProductManager';
import { useSSE } from './hooks/useSSE';
import { hasAccessKey, getProducts, getShoppingList, login, setAccessKey, getAccessKey } from './api/client';

import './styles/main.css';

function AppContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(hasAccessKey());
  const [householdName, setHouseholdName] = useState('');
  const [products, setProducts] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productsData, shoppingData] = await Promise.all([
        getProducts(),
        getShoppingList(),
      ]);
      setProducts(productsData);
      setShoppingItems(shoppingData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSSEUpdate = useCallback((message) => {
    if (message.type === 'products_updated' || message.type === 'shopping_updated') {
      fetchData();
    }
  }, [fetchData]);

  useSSE(isLoggedIn ? handleSSEUpdate : () => {});

  // Handle automatic login from URL parameter
  useEffect(() => {
    const handleAutoLogin = async () => {
      const keyFromUrl = searchParams.get('key');

      if (keyFromUrl && !autoLoginAttempted) {
        setAutoLoginAttempted(true);
        const currentKey = getAccessKey();

        // If different key or not logged in, login with the new key
        if (keyFromUrl !== currentKey) {
          try {
            const result = await login(keyFromUrl);
            if (result.success) {
              setHouseholdName(result.household_name);
              setIsLoggedIn(true);
              // Remove key from URL
              searchParams.delete('key');
              navigate('?' + searchParams.toString(), { replace: true });
            }
          } catch (err) {
            console.error('Auto-login failed:', err);
          }
        } else {
          // Same key, just remove from URL
          searchParams.delete('key');
          navigate('?' + searchParams.toString(), { replace: true });
        }
      }
    };

    handleAutoLogin();
  }, [searchParams, navigate, autoLoginAttempted]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  const handleLogin = (name) => {
    setHouseholdName(name);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="app">
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <ShoppingList
                products={products}
                shoppingItems={shoppingItems}
                onRefresh={fetchData}
              />
            }
          />
          <Route
            path="/bulk"
            element={
              <BulkAdd
                products={products}
                shoppingItems={shoppingItems}
                onRefresh={fetchData}
              />
            }
          />
          <Route
            path="/shopping"
            element={
              <ShoppingMode
                shoppingItems={shoppingItems}
                onRefresh={fetchData}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductManager
                products={products}
                shoppingItems={shoppingItems}
                onRefresh={fetchData}
              />
            }
          />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
