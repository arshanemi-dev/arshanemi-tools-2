'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, UserCheck, Check, X, User, Building2 } from 'lucide-react'
import { addUser, updateUser, deleteUser, setActiveUserId } from '@/lib/dataStore'
import { cn } from '@/lib/utils'

const ROLES = ['admin', 'user']

const ROLE_STYLES = {
  admin:  { badge: 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/30', avatar: 'bg-[var(--lt-accent)] text-white' },
  user: { badge: 'text-[var(--lt-success)] bg-[var(--lt-success-bg)] border-[var(--lt-success)]/30', avatar: 'bg-[var(--lt-success)] text-white' },
}

const BLANK = { name: '', email: '', role: 'user', companyId: null }

// ── Inline create / edit form ─────────────────────────────────────────────────

function UserForm({ initial = BLANK, companies = [], onSave, onCancel, title }) {
  const [f, setF] = useState({ ...BLANK, ...initial })
  const ok = f.name.trim().length > 0 && f.email.trim().length > 0

  function textField(key, label, type = 'text', placeholder = '') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">{label}</label>
        <input
          type={type}
          value={f[key]}
          onChange={e => setF(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] placeholder-[var(--lt-text-subtle)] focus:outline-none focus:border-[var(--lt-accent)] focus:bg-[var(--lt-card)] transition-all"
        />
      </div>
    )
  }

  return (
    <div className="p-4 bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 rounded-[12px] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--lt-accent-light)] uppercase tracking-wider">{title}</p>
        <button onClick={onCancel} className="p-1 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {textField('name',  'Name',  'text',  'Full name')}
        {textField('email', 'Email', 'email', 'email@example.com')}
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">Role</label>
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setF(p => ({ ...p, role: r }))}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-[8px] border capitalize transition-all',
                f.role === r
                  ? ROLE_STYLES[r].badge
                  : 'text-[var(--lt-text-subtle)] bg-[var(--lt-bg-base)] border-[var(--lt-divider-light)] hover:border-[var(--lt-text-subtle)]'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Company selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-[var(--lt-text-subtle)] uppercase tracking-wider">Company</label>
        {companies.length === 0 ? (
          <p className="text-[11px] text-[var(--lt-text-subtle)] italic px-1">
            No companies yet — create one in the Company tab first.
          </p>
        ) : (
          <select
            value={f.companyId ?? ''}
            onChange={e => setF(p => ({ ...p, companyId: e.target.value || null }))}
            className="w-full px-3 py-2.5 bg-[var(--lt-bg-base)] border border-[var(--lt-divider-light)] rounded-[8px] text-sm text-[var(--lt-text-primary)] focus:outline-none focus:border-[var(--lt-accent)] transition-all appearance-none"
          >
            <option value="">— No company —</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name || c.email} ({c.folderId})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          disabled={!ok}
          onClick={() => ok && onSave(f)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--lt-accent)] text-white text-sm font-semibold rounded-[8px] hover:bg-[var(--lt-accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Check size={13} />
          {title === 'Edit User' ? 'Save Changes' : 'Create User'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-[var(--lt-text-subtle)] font-medium bg-[var(--lt-card-hover)] rounded-[8px] hover:text-[var(--lt-text-primary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ user, companies, isActive, onActivate, onEdit, onDelete }) {
  const rs = ROLE_STYLES[user.role] ?? ROLE_STYLES.user
  const company = companies.find(c => c.id === user.companyId)

  return (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-[10px] border transition-all',
      isActive
        ? 'bg-[var(--lt-accent-muted)] border-[var(--lt-accent)]/40'
        : 'bg-[var(--lt-card)] border-[var(--lt-divider)] hover:border-[var(--lt-divider-light)]'
    )}>
      {/* Avatar */}
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0', rs.avatar)}>
        {user.name[0]?.toUpperCase() ?? <User size={14} />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--lt-text-primary)] truncate">{user.name}</p>
          <span className={cn('shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border uppercase', rs.badge)}>
            {user.role}
          </span>
        </div>
        <p className="text-xs text-[var(--lt-text-subtle)] truncate mt-0.5">{user.email}</p>
        {company && (
          <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/20 rounded-full px-1.5 py-0.5 font-mono">
            <Building2 size={9} />
            {company.folderId}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isActive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--lt-success)] bg-[var(--lt-success-bg)] border border-[var(--lt-success)]/30 px-2.5 py-1.5 rounded-full">
            <UserCheck size={10} />
            Active
          </span>
        ) : (
          <button
            onClick={() => onActivate(user.id)}
            className="text-[10px] font-bold text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 px-2.5 py-1.5 rounded-full hover:bg-[var(--lt-accent)] hover:text-white hover:border-[var(--lt-accent)] transition-all"
          >
            Activate
          </button>
        )}
        <button
          onClick={() => onEdit(user)}
          title="Edit"
          className="p-1.5 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)] rounded-[6px] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(user.id)}
          title="Delete"
          className="p-1.5 text-[var(--lt-text-subtle)] hover:text-[var(--lt-danger-text)] hover:bg-[var(--lt-danger-bg)] rounded-[6px] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function UsersPanel({ users, companies = [], activeUserId, onRefresh }) {
  const [creating, setCreating] = useState(false)
  const [editing,  setEditing]  = useState(null)

  async function handleCreate(data) {
    await addUser(data)
    setCreating(false)
    onRefresh()
  }

  async function handleUpdate(data) {
    await updateUser(editing.id, data)
    setEditing(null)
    onRefresh()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    await deleteUser(id)
    onRefresh()
  }

  function handleActivate(id) {
    setActiveUserId(id)
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--lt-text-subtle)]">
          {users.length} local user{users.length !== 1 ? 's' : ''}
          {activeUserId && ' · 1 active'}
        </p>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--lt-accent)] text-white text-xs font-semibold rounded-[8px] hover:bg-[var(--lt-accent-hover)] transition-colors"
          >
            <Plus size={13} />
            Add User
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <UserForm
          title="New User"
          companies={companies}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* Empty state */}
      {users.length === 0 && !creating && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-[var(--lt-card)] border border-[var(--lt-divider)] flex items-center justify-center">
            <User size={20} className="text-[var(--lt-divider-light)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--lt-text-muted)]">No users yet</p>
            <p className="text-xs text-[var(--lt-text-subtle)] mt-1">Click "Add User" to create your first local user.</p>
          </div>
        </div>
      )}

      {/* Users list */}
      {users.length > 0 && (
        <div className="flex flex-col gap-2">
          {users.map(user => {
            if (editing?.id === user.id) {
              return (
                <UserForm
                  key={user.id}
                  title="Edit User"
                  companies={companies}
                  initial={{ name: user.name, email: user.email, role: user.role, companyId: user.companyId ?? null }}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              )
            }
            return (
              <UserRow
                key={user.id}
                user={user}
                companies={companies}
                isActive={user.id === activeUserId}
                onActivate={handleActivate}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      )}

    </div>
  )
}
