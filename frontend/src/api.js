const API_BASE = '/api/v1';

export async function fetchPosts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/posts?${query}` : `${API_BASE}/posts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchPost(idOrSlug) {
  const res = await fetch(`${API_BASE}/posts/${idOrSlug}`);
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

export async function fetchPages(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/pages?${query}` : `${API_BASE}/pages`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}

export async function fetchPage(slug) {
  const res = await fetch(`${API_BASE}/pages/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch page');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchHomepageConfig() {
  const res = await fetch(`${API_BASE}/homepage`);
  if (!res.ok) throw new Error('Failed to fetch homepage configuration');
  return res.json();
}

export async function fetchMenu() {
  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch navigation menu');
  return res.json();
}

export async function adminLogin(password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function createPost(postData, token) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify(postData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create post');
  }
  return res.json();
}

export async function updatePost(id, postData, token) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify(postData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update post');
  }
  return res.json();
}

export async function deletePost(id, token) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete post');
  }
  return res.json();
}
