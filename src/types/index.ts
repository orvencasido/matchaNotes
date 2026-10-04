import type { Database, Tables, TablesInsert, TablesUpdate } from '../../types/database.types'

export type { Database }

export type Note = Tables<'notes'>
export type NoteInsert = TablesInsert<'notes'>
export type NoteUpdate = TablesUpdate<'notes'>

export type VaultItem = Tables<'vault_items'>
export type VaultItemInsert = TablesInsert<'vault_items'>
export type VaultItemUpdate = TablesUpdate<'vault_items'>

export type VaultConfig = Tables<'vault_config'>
export type VaultConfigInsert = TablesInsert<'vault_config'>
export type VaultConfigUpdate = TablesUpdate<'vault_config'>

export type NoteAttachment = Tables<'note_attachments'>
export type NoteAttachmentInsert = TablesInsert<'note_attachments'>
export type NoteAttachmentUpdate = TablesUpdate<'note_attachments'>

export type VaultCategory = 'Accounts' | 'Passwords' | 'Cards' | 'Notes'

export interface DecryptedVaultPayload {
  username?: string
  password?: string
  url?: string
  notes?: string
  group?: string
  // For card items
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  cvv?: string
  [key: string]: unknown
}

export interface DecryptedVaultItem {
  id: string
  userId: string
  title: string
  category: VaultCategory
  payload: DecryptedVaultPayload
  createdAt: string
  updatedAt: string
  sort_order?: number | null
}

export interface CreateVaultItemInput {
  title: string
  category: VaultCategory
  payload: DecryptedVaultPayload
  sort_order?: number | null
}

export interface UpdateVaultItemInput {
  title?: string
  category?: VaultCategory
  payload?: DecryptedVaultPayload
  sort_order?: number | null
}

export interface CreateNoteInput {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  is_pinned?: boolean
  sort_order?: number | null
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  is_pinned?: boolean
  sort_order?: number | null
}
