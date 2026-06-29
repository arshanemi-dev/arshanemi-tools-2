import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

const EXT_MAP = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  svg: 'image', avif: 'image', heic: 'image',
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio',
  pdf: 'pdf',
  doc: 'doc', docx: 'doc',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation',
  zip: 'archive', rar: 'archive', tar: 'archive', gz: 'archive', '7z': 'archive',
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code', py: 'code',
  html: 'code', css: 'code', json: 'code', xml: 'code',
  txt: 'text', md: 'text',
}

export function getFileType(name) {
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MAP[ext] ?? 'file'
}

export function isImage(name) {
  return getFileType(name) === 'image'
}

export function getParentPath(path) {
  if (!path || path === '/') return ''
  const parts = path.split('/').filter(Boolean)
  parts.pop()
  return parts.length ? '/' + parts.join('/') : ''
}

export function joinPath(...segments) {
  return '/' + segments.filter(Boolean).join('/').replace(/\/+/g, '/').replace(/^\/+/, '')
}
