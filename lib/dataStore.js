'use client'

/**
 * User & Company storage — always server-side JSON files via API.
 * data/users.json   ← all users
 * data/company.json ← all companies
 *
 * Active-user selection is still per-browser (localStorage only).
 * SKU data has its own skuStore.js that respects NEXT_PUBLIC_IS_CONNECT.
 */

import {
  setActiveUserId as lsSetActiveUserId,
  getActiveUserId as lsGetActiveUserId,
} from './localStore'

// ── Shared fetch helper ────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const res  = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getUsers() {
  const data = await apiFetch('/api/users')
  return data.users || []
}

export async function addUser(userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body:   JSON.stringify(userData),
  })
}

export async function updateUser(id, userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body:   JSON.stringify({ id, ...userData, action: 'update' }),
  })
}

export async function deleteUser(id) {
  return apiFetch('/api/users', {
    method: 'DELETE',
    body:   JSON.stringify({ id }),
  })
}

// Active user is per-browser session (localStorage only)
export function getActiveUserId() { return lsGetActiveUserId() }
export function setActiveUserId(id) { return lsSetActiveUserId(id) }

export function getActiveUser(users = []) {
  const id = lsGetActiveUserId()
  return id ? (users.find(u => u.id === id) ?? null) : null
}

// ── Companies ──────────────────────────────────────────────────────────────────

export async function getCompanies() {
  const data = await apiFetch('/api/companies')
  return data.companies || []
}

export async function addCompany(companyData) {
  return apiFetch('/api/companies', {
    method: 'POST',
    body:   JSON.stringify(companyData),
  })
}

export async function updateCompany(id, companyData) {
  return apiFetch('/api/companies', {
    method: 'POST',
    body:   JSON.stringify({ id, ...companyData, action: 'update' }),
  })
}

export async function deleteCompany(id) {
  return apiFetch('/api/companies', {
    method: 'DELETE',
    body:   JSON.stringify({ id }),
  })
}
