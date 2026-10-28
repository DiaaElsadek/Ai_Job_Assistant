'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { CompanyDialog, type CompanyFormDataInput } from './company-dialog'
import { DeleteCompanyDialog } from './delete-company-dialog'

interface CompanyDetailActionsProps {
  company: CompanyFormDataInput & { id: string; name: string }
}

export function CompanyDetailActions({ company }: CompanyDetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary hover:text-error hover:bg-error/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
      </div>

      {editOpen && (
        <CompanyDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          company={company}
        />
      )}

      {deleteOpen && (
        <DeleteCompanyDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          companyId={company.id}
          companyName={company.name}
          redirectTo="/companies"
        />
      )}
    </>
  )
}
