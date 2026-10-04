import React from 'react'
import { useUI } from '@/hooks/useUI'
import { NotesView } from './NotesView'
import { TodosView } from './TodosView'
import { MediaView } from './MediaView'
import { VaultView } from './VaultView'

export const ActiveViewContainer: React.FC = () => {
  const { activeView } = useUI()

  switch (activeView) {
    case 'notes':
      return <NotesView />
    case 'todos':
      return <TodosView />
    case 'media':
      return <MediaView />
    case 'vault':
      return <VaultView />
    default:
      return <NotesView />
  }
}
