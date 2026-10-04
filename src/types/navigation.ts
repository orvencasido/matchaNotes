export type NavView = 'notes' | 'todos' | 'media' | 'vault'

export type FilterCategory = 'all' | 'pinned' | 'general' | 'personal' | 'work' | 'ideas' | 'to-do'

export interface NavItemConfig {
  id: NavView
  label: string
  iconName: 'FileText' | 'CheckSquare' | 'Image' | 'Shield'
  badge?: string
}
