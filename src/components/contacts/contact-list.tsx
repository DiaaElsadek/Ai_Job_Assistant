'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  Plus,
  Search,
  Building2,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  Calendar,
  MessageSquarePlus,
  Eye,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge, StatusBadge } from '@/src/components/ui/badge'
import { EmptyState } from '@/src/components/ui/empty-state'
import { ContactDialog, type ContactFormDataInput } from './contact-dialog'
import { DeleteContactDialog } from './delete-contact-dialog'
import { LogTouchpointDialog } from './log-touchpoint-dialog'

export interface ContactItem {
  id: string
  fullName: string
  role: string | null
  profileUrl: string | null
  publicSourceUrl: string | null
  category: 'RECRUITER' | 'HR' | 'SENIOR_FRONTEND_DEV' | 'TECH_LEAD' | 'ENGINEERING_MANAGER' | 'OTHER'
  location: string | null
  reasonForTargeting: string | null
  personalizationNotes: string | null
  relationshipStatus: 'TO_RESEARCH' | 'READY_FOR_OUTREACH' | 'REQUEST_SENT' | 'CONNECTED' | 'MESSAGE_SENT' | 'REPLIED' | 'REFERRAL_DISCUSSED' | 'FOLLOW_UP_NEEDED' | 'ARCHIVED'
  lastContactDate: Date | string | null
  nextFollowUpDate: Date | string | null
  networkingPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  verificationStatus: 'VERIFIED' | 'OUTDATED' | 'UNCERTAIN'
  notes: string | null
  createdAt: Date | string
  company: {
    id: string
    name: string
    location?: string | null
  } | null
  _count: {
    opportunities: number
    messageDrafts: number
    communicationHistory: number
  }
}

interface ContactListProps {
  contacts: ContactItem[]
  total: number
  page: number
  totalPages: number
  companies: { id: string; name: string }[]
  initialSearch?: string
  initialCategory?: string
  initialStatus?: string
  initialPriority?: string
  initialSortBy?: string
}

export function ContactList({
  contacts,
  total,
  page,
  totalPages,
  companies,
  initialSearch = '',
  initialCategory = '',
  initialStatus = '',
  initialPriority = '',
  initialSortBy = 'createdAt',
}: ContactListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactFormDataInput | null>(null)
  const [deletingContact, setDeletingContact] = useState<{ id: string; fullName: string } | null>(null)
  const [touchpointContact, setTouchpointContact] = useState<{ id: string; fullName: string } | null>(null)

  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [status, setStatus] = useState(initialStatus)
  const [priority, setPriority] = useState(initialPriority)
  const [sortBy, setSortBy] = useState(initialSortBy)

  const applyFilters = (
    newSearch?: string,
    newCategory?: string,
    newStatus?: string,
    newPriority?: string,
    newSortBy?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    const s = newSearch !== undefined ? newSearch : search
    const c = newCategory !== undefined ? newCategory : category
    const st = newStatus !== undefined ? newStatus : status
    const p = newPriority !== undefined ? newPriority : priority
    const sort = newSortBy !== undefined ? newSortBy : sortBy

    if (s) params.set('search', s)
    else params.delete('search')

    if (c) params.set('category', c)
    else params.delete('category')

    if (st) params.set('status', st)
    else params.delete('status')

    if (p) params.set('priority', p)
    else params.delete('priority')

    if (sort && sort !== 'createdAt') params.set('sortBy', sort)
    else params.delete('sortBy')

    params.delete('page')
    router.push(`/contacts?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(search)
  }

  const handleClearFilters = () => {
    setSearch('')
    setCategory('')
    setStatus('')
    setPriority('')
    setSortBy('createdAt')
    router.push('/contacts')
  }

  const hasFilters = !!search || !!category || !!status || !!priority || sortBy !== 'createdAt'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Networking Contacts
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Build personal connections with recruiters, tech leads, and referral targets in Egypt and remote.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Contact
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, role, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              applyFilters(undefined, e.target.value)
            }}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Categories</option>
            <option value="RECRUITER">Tech Recruiter</option>
            <option value="HR">HR / Talent</option>
            <option value="SENIOR_FRONTEND_DEV">Senior Frontend Dev</option>
            <option value="TECH_LEAD">Tech Lead</option>
            <option value="ENGINEERING_MANAGER">Eng Manager</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              applyFilters(undefined, undefined, e.target.value)
            }}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Relationship Stages</option>
            <option value="TO_RESEARCH">To Research</option>
            <option value="READY_FOR_OUTREACH">Ready for Outreach</option>
            <option value="REQUEST_SENT">Request Sent</option>
            <option value="CONNECTED">Connected</option>
            <option value="MESSAGE_SENT">Message Sent</option>
            <option value="REPLIED">Replied</option>
            <option value="REFERRAL_DISCUSSED">Referral Discussed</option>
            <option value="FOLLOW_UP_NEEDED">Follow-up Needed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
              applyFilters(undefined, undefined, undefined, e.target.value)
            }}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              applyFilters(undefined, undefined, undefined, undefined, e.target.value)
            }}
            className="h-9 px-3 rounded-lg text-xs bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="createdAt">Recently Added</option>
            <option value="nextFollowUpDate">Next Follow-up</option>
            <option value="lastContactDate">Last Contacted</option>
            <option value="fullName">Name (A-Z)</option>
            <option value="networkingPriority">Priority</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-text-muted hover:text-accent underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title={hasFilters ? 'No matching contacts' : 'No networking contacts yet'}
          description={
            hasFilters
              ? 'Try clearing or relaxing your search filters.'
              : 'Add recruiters, team leads, or engineers to track your outreach.'
          }
          action={
            hasFilters ? (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Your First Contact
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-tertiary/40 text-[11px] font-semibold text-text-secondary">
                  <th className="py-3 px-4">Name & Role</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3 hidden md:table-cell">Touchpoints</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-bg-hover/60 transition-colors group"
                  >
                    {/* Name & Role */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="font-medium text-text-primary hover:text-accent transition-colors block"
                          >
                            {contact.fullName}
                          </Link>
                          {contact.profileUrl && (
                            <a
                              href={contact.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-muted hover:text-accent"
                              title="LinkedIn Profile"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted">
                          {contact.role || 'Role unassigned'}
                        </p>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3 px-3">
                      {contact.company ? (
                        <Link
                          href={`/companies/${contact.company.id}`}
                          className="inline-flex items-center gap-1 text-text-secondary hover:text-accent font-medium truncate max-w-[150px]"
                        >
                          <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                          <span className="truncate">{contact.company.name}</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-text-muted">Unassigned</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <Badge variant="default" className="text-[10px]">
                        {contact.category.toLowerCase().replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-3">
                      <StatusBadge status={contact.relationshipStatus} />
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <StatusBadge status={contact.networkingPriority} />
                    </td>

                    {/* Touchpoints / Follow-up */}
                    <td className="py-3 px-3 hidden md:table-cell text-[11px] text-text-muted">
                      {contact.nextFollowUpDate ? (
                        <div className="text-warning font-medium">
                          Next: {new Date(contact.nextFollowUpDate).toLocaleDateString()}
                        </div>
                      ) : contact.lastContactDate ? (
                        <div>
                          Contacted: {new Date(contact.lastContactDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-text-muted">No touchpoint yet</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setTouchpointContact({ id: contact.id, fullName: contact.fullName })
                          }
                          className="p-1.5 text-text-muted hover:text-accent rounded-md transition-colors"
                          title="Log Touchpoint"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="p-1.5 text-text-muted hover:text-text-primary rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEditingContact(contact)}
                          className="p-1.5 text-text-muted hover:text-accent rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeletingContact({ id: contact.id, fullName: contact.fullName })
                          }
                          className="p-1.5 text-text-muted hover:text-error rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-tertiary/20 text-xs">
              <span className="text-text-muted">
                Showing {contacts.length} of {total} contacts
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(page - 1))
                    router.push(`/contacts?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <span className="text-text-secondary px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(page + 1))
                    router.push(`/contacts?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ContactDialog
        open={createDialogOpen || !!editingContact}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingContact(null)
        }}
        contact={editingContact}
        companies={companies}
      />

      <DeleteContactDialog
        open={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        contact={deletingContact}
      />

      {touchpointContact && (
        <LogTouchpointDialog
          open={!!touchpointContact}
          onClose={() => setTouchpointContact(null)}
          contactId={touchpointContact.id}
          contactName={touchpointContact.fullName}
        />
      )}
    </div>
  )
}

