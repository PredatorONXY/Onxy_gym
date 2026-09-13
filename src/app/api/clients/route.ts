// src/app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all clients (users who are not admins or trainers)
    const clients = await prisma.user.findMany({
      where: {
        isAdmin: false,
        isTrainer: false
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to the expected format (include fields the dashboard expects)
    const clientList = clients.map(client => ({
      id: client.id,
      name: client.fullName || client.email,
      email: client.email,
      created_at: client.createdAt
    }));

    return NextResponse.json({ clients: clientList });
  } catch (err: any) {
    console.error('Clients API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
