'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import apiClient from '@/lib/api/client'
import { clientsApi } from '@/lib/api/clients'
import { toast } from 'sonner'
import { StickyNote, Lock, User, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const TYPE_COLORS: Record<string, string> = {
  general:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  medical:   'text-red-400 bg-red-500/10 border-red-500/20',
  training:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  nutrition: 'text-green-400 bg-green-500/10 border-green-500/20',
}

const inputClass = "w-full bg-graphite-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"

export default function TrainerNotesPage() {
  const qc = useQueryClient()
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('general')

  const { data: clientsData } = useQuery({
    queryKey: ['trainer-clients-notes'],
    queryFn: () => apiClient.get('/my-clients').then(r => r.data),
  })
  const clients: any[] = clientsData?.data ?? []

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['client-notes', selectedClient],
    queryFn: () => clientsApi.notes(Number(selectedClient)).then(r => r.data),
    enabled: !!selectedClient,
  })
  const notes: any[] = notesData?.data ?? []

  const addNote = useMutation({
    mutationFn: () => clientsApi.addNote(Number(selectedClient), { content, type }),
    onSuccess: () => {
      toast.success('Note added')
      setContent('')
      qc.invalidateQueries({ queryKey: ['client-notes', selectedClient] })
    },
    onError: () => toast.error('Failed to add note'),
  })

  const deleteNote = useMutation({
    mutationFn: (noteId: number) => clientsApi.deleteNote(noteId),
    onSuccess: () => { toast.success('Note deleted'); qc.invalidateQueries({ queryKey: ['client-notes', selectedClient] }) },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text">Client Notes</h1>
        <p className="text-muted-foreground mt-1">View and add notes for your clients</p>
      </motion.div>

      {/* Client selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <label className="block text-sm text-muted-foreground mb-2">Select Client</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 bg-graphite-800 border border-white/8 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 transition-colors">
          <option value="">— Choose a client —</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
      </motion.div>

      {!selectedClient ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-card p-12 border border-white/5 text-center">
          <StickyNote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Select a client to view and add notes</p>
        </motion.div>
      ) : (
        <>
          {/* Add note form */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-5 border border-white/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" /> Add Note
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={type} onChange={e => setType(e.target.value)} className={inputClass}>
                  <option value="general">General</option>
                  <option value="training">Training</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="medical">Medical</option>
                </select>
                <div className="sm:col-span-2">
                  <textarea value={content} onChange={e => setContent(e.target.value)}
                    placeholder="Write a note for this client…"
                    rows={3}
                    className={inputClass + ' resize-none'} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => addNote.mutate()} disabled={!content.trim() || addNote.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                  <Plus className="w-4 h-4" /> {addNote.isPending ? 'Adding…' : 'Add Note'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notes list */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-5 border border-white/5 animate-pulse">
                  <div className="h-4 bg-graphite-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-graphite-700 rounded w-full mb-1" />
                  <div className="h-3 bg-graphite-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-12 border border-white/5 text-center">
              <StickyNote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No notes for this client yet</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notes.map((note: any, i: number) => (
                <motion.div key={note.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card p-5 border border-white/5 group">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.title && <h3 className="font-semibold text-sm">{note.title}</h3>}
                      {note.type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[note.type] ?? TYPE_COLORS.general}`}>
                          {note.type}
                        </span>
                      )}
                      {note.is_private && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <time className="text-xs text-muted-foreground">{format(new Date(note.created_at), 'MMM d, yyyy')}</time>
                      <button onClick={() => deleteNote.mutate(note.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
                  {note.author && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                      <User className="w-3 h-3" /> {note.author.first_name} {note.author.last_name}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
