import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    client: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  }
}))

import { POST } from './route'
import { prisma } from '@/lib/prisma'

describe('POST /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new user and client when user does not exist', async () => {
    const fakeUserId = 'new-user-123'

    // @ts-ignore
    prisma.user.findUnique.mockResolvedValue(null)
    // @ts-ignore
    prisma.user.create.mockResolvedValue({
      id: fakeUserId,
      email: 'new@example.com',
      fullName: 'New User',
      isAdmin: false,
      isTrainer: false,
      createdAt: new Date('2024-01-01T00:00:00Z')
    })
    // @ts-ignore
    prisma.client.findFirst.mockResolvedValue(null)
    // @ts-ignore
    prisma.client.create.mockResolvedValue({
      id: 'client-123',
      userId: fakeUserId,
      age: null,
      gender: null,
      goals: null,
      joinedAt: new Date()
    })

    const req = new Request('http://localhost/api/profile', {
      method: 'POST',
      body: JSON.stringify({ user_id: fakeUserId, name: 'New User', email: 'new@example.com', role: 'client' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const res = await POST(req)
    const text = await res.text()
    const body = JSON.parse(text)

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: fakeUserId } })
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: fakeUserId, email: 'new@example.com', fullName: 'New User' }) }))
    expect(prisma.client.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: fakeUserId }) }))

    expect(body).toHaveProperty('profile')
    expect(body.profile).toHaveProperty('userId', fakeUserId)
    expect(body.profile).toHaveProperty('email', 'new@example.com')
  })
})