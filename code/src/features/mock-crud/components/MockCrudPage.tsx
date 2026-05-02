import { type FormEvent, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { mockItems } from '../data/mockItems'
import type { MockItem, MockItemStatus } from '../types/mockItem'

const statusOptions: MockItemStatus[] = ['Active', 'Maintenance', 'Inactive']

type FormState = {
  name: string
  location: string
  status: MockItemStatus
}

const initialFormState: FormState = {
  name: '',
  location: '',
  status: 'Active',
}

function createItemId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `ITEM-${Date.now()}`
}

function MockCrudPage() {
  const [items, setItems] = useState<MockItem[]>(mockItems)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId),
    [editingId, items]
  )

  const isEditing = Boolean(editingItem)

  function resetForm() {
    setForm(initialFormState)
    setEditingId(null)
    setFormError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = form.name.trim()
    const location = form.location.trim()

    if (!name || !location) {
      setFormError('Name and location are required.')
      return
    }

    if (isEditing && editingId) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingId
            ? { ...item, name, location, status: form.status }
            : item
        )
      )
    } else {
      setItems((currentItems) => [
        { id: createItemId(), name, location, status: form.status },
        ...currentItems,
      ])
    }

    resetForm()
  }

  function handleEdit(item: MockItem) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      location: item.location,
      status: item.status,
    })
    setFormError('')
  }

  function handleDelete(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))

    if (editingId === id) {
      resetForm()
    }
  }

  return (
    <main className="mock-crud-page">
      <section className="mock-crud-hero">
        <p className="eyebrow">Sprint 1 · KAN-418</p>
        <h1>CRUD static data mock</h1>
        <p>
          Test workflow AI với dữ liệu mẫu phía frontend, không dùng Backend API.
        </p>
      </section>

      <section className="mock-crud-grid">
        <Card className="mock-crud-card">
          <CardHeader>
            <CardTitle>{isEditing ? 'Update item' : 'Create item'}</CardTitle>
            <CardDescription>
              {isEditing
                ? `Editing ${editingItem?.id}`
                : 'Add a sample battery item to the local list.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="mock-crud-form" onSubmit={handleSubmit}>
              <label>
                Name
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Battery Pack D4"
                />
              </label>

              <label>
                Location
                <Input
                  value={form.location}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Solar Farm Zone D"
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as MockItemStatus,
                    }))
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              {formError ? <p className="form-error">{formError}</p> : null}

              <div className="mock-crud-actions">
                <Button type="submit">
                  {isEditing ? 'Save changes' : 'Add item'}
                </Button>
                {isEditing ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mock-crud-card">
          <CardHeader>
            <CardTitle>Sample data list</CardTitle>
            <CardDescription>
              GET mock result · {items.length} item{items.length === 1 ? '' : 's'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <div className="mock-crud-list">
                {items.map((item) => (
                  <article className="mock-crud-item" key={item.id}>
                    <div>
                      <p className="mock-crud-item-id">{item.id}</p>
                      <h2>{item.name}</h2>
                      <p>{item.location}</p>
                    </div>
                    <div className="mock-crud-item-actions">
                      <span data-status={item.status}>{item.status}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mock-crud-empty">
                <h2>No items yet</h2>
                <p>Add a new item to repopulate the mock list.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export { MockCrudPage }
