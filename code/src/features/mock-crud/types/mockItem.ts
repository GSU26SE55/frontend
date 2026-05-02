export type MockItemStatus = 'Active' | 'Maintenance' | 'Inactive'

export type MockItem = {
  id: string
  name: string
  location: string
  status: MockItemStatus
}
