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

export async function adminLogin(password, username = 'admin') {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function adminVerify(token) {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    return false;
  }
  return true;
}

export async function adminChangePassword(oldPassword, newPassword, token) {
  const res = await fetch(`${API_BASE}/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to change password');
  }
  return res.json();
}

export async function fetchAdminStats(token) {
  const res = await fetch(`${API_BASE}/stats`, {
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
}

export async function fetchMedia(limit = 60) {
  const res = await fetch(`${API_BASE}/media?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch media');
  return res.json();
}

export async function uploadMedia(formData, token) {
  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to upload media');
  }
  return res.json();
}

export async function deleteMedia(id, token) {
  const res = await fetch(`${API_BASE}/media/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete media');
  }
  return res.json();
}

export async function updateHomepageConfig(config, token) {
  const res = await fetch(`${API_BASE}/homepage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update homepage config');
  }
  return res.json();
}

export async function updateNavigationMenu(menu, token) {
  const res = await fetch(`${API_BASE}/menu`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(menu),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update menu');
  }
  return res.json();
}

export async function resetNavigationMenu(token) {
  const res = await fetch(`${API_BASE}/menu/reset`, {
    method: 'POST',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to reset menu');
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

export async function createPage(pageData, token) {
  const res = await fetch(`${API_BASE}/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(pageData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create page');
  }
  return res.json();
}

export async function updatePage(id, pageData, token) {
  const res = await fetch(`${API_BASE}/pages/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(pageData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update page');
  }
  return res.json();
}

export async function deletePage(id, token) {
  const res = await fetch(`${API_BASE}/pages/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete page');
  }
  return res.json();
}

export async function agentCreateOrUpdatePage(pageData, agentKey) {
  if (!agentKey) throw new Error('Agent Key is required');
  const res = await fetch(`${API_BASE}/agent/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Key': agentKey,
    },
    body: JSON.stringify(pageData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update page via agent');
  }
  return res.json();
}

// User Management APIs
export async function fetchUsers(token) {
  const res = await fetch(`${API_BASE}/users`, {
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch users');
  }
  return res.json();
}

export async function createUser(userData, token) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(id, userData, token) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update user');
  }
  return res.json();
}

export async function deleteUser(id, token) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete user');
  }
  return res.json();
}

// AI Agent API Key Management APIs
export async function fetchAgentKeys(token) {
  const res = await fetch(`${API_BASE}/agent-keys`, {
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch agent keys');
  }
  return res.json();
}

export async function createAgentKey(keyData, token) {
  const res = await fetch(`${API_BASE}/agent-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || 'authenticated-admin',
    },
    body: JSON.stringify(keyData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create agent key');
  }
  return res.json();
}

export async function deleteAgentKey(id, token) {
  const res = await fetch(`${API_BASE}/agent-keys/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete agent key');
  }
  return res.json();
}

export async function toggleAgentKey(id, token) {
  const res = await fetch(`${API_BASE}/agent-keys/${id}/toggle`, {
    method: 'PUT',
    headers: {
      'X-Admin-Token': token || 'authenticated-admin',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to toggle agent key');
  }
  return res.json();
}

export async function fetchSiteSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch site settings');
  return res.json();
}

export async function updateSiteSettings(settings, authHeader = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeader,
  };
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update site settings');
  }
  return res.json();
}

/**
 * Generate Next.js style optimized image URL
 */
export function getOptimizedImageUrl(src, { width, quality = 75, format } = {}) {
  if (!src || typeof src !== 'string') return '';
  if (src.endsWith('.svg') || src.startsWith('data:')) return src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;

  const params = new URLSearchParams();
  params.set('url', src);
  if (width && width > 0) params.set('w', String(Math.round(width)));
  if (quality && quality > 0) params.set('q', String(quality));
  if (format) params.set('format', format);

  return `/api/v1/images?${params.toString()}`;
}


