const API_BASE = '/api';

export function getAccessKey() {
  return localStorage.getItem('accessKey');
}

export function setAccessKey(key) {
  localStorage.setItem('accessKey', key);
}

export function clearAccessKey() {
  localStorage.removeItem('accessKey');
}

export function hasAccessKey() {
  return !!getAccessKey();
}

async function request(endpoint, options = {}) {
  const accessKey = getAccessKey();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessKey) {
    headers['X-Access-Key'] = accessKey;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAccessKey();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Auth
export async function login(accessKey) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ access_key: accessKey }),
  });

  if (result.success) {
    setAccessKey(accessKey);
  }

  return result;
}

// Products
export async function getProducts() {
  return request('/products');
}

export async function createProduct(name) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateProduct(id, name) {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function deleteProduct(id) {
  return request(`/products/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderProducts(productIds) {
  return request('/products/reorder', {
    method: 'PUT',
    body: JSON.stringify({ product_ids: productIds }),
  });
}

// Shopping
export async function getShoppingList() {
  return request('/shopping');
}

export async function addToShoppingList(item) {
  return request('/shopping', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateShoppingItem(id, item) {
  return request(`/shopping/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function deleteShoppingItem(id) {
  return request(`/shopping/${id}`, {
    method: 'DELETE',
  });
}

export async function checkShoppingItem(id, isChecked) {
  return request(`/shopping/${id}/check`, {
    method: 'PUT',
    body: JSON.stringify({ is_checked: isChecked }),
  });
}

export async function clearShoppingList(keepUnchecked = false) {
  return request('/shopping/clear', {
    method: 'POST',
    body: JSON.stringify({ keep_unchecked: keepUnchecked }),
  });
}
