import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the prisma module before importing the route
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findMany: vi.fn()
      }
    }
  }
})

import { GET } from './route'
import { prisma } from '@/lib/prisma'

describe('GET /api/clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns clients with the expected fields', async () => {
    const mockClients = [
      {
        id: 'client-1',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: new Date('2023-01-02T03:04:05.000Z'),
        isAdmin: false,
        isTrainer: false
      }
    ]

    // @ts-ignore - mocked implementation
    prisma.user.findMany.mockResolvedValue(mockClients)

    const res = await GET()
    const text = await res.text()
    const body = JSON.parse(text)

    // ensure prisma was queried with the correct criteria
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isAdmin: false, isTrainer: false },
      select: { id: true, fullName: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    }))

    // verify the returned payload shape
    expect(body).toHaveProperty('clients')
    expect(body.clients).toHaveLength(1)
    expect(body.clients[0]).toEqual({
      id: 'client-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      created_at: '2023-01-02T03:04:05.000Z'
    })
  })
})