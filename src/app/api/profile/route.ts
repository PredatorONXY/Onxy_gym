// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, name, role, avatar_url, email } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // First, ensure the user exists in the User table
    let user = await prisma.user.findUnique({
      where: { id: user_id }
    });

    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          id: user_id,
          email: email || `${user_id}@temp.com`,
          fullName: name || 'Unknown User',
          isAdmin: role === 'admin',
          isTrainer: role === 'trainer',
        }
      });
    } else {
      // Update existing user with provided name/email if present
      const updateData: any = {}
      if (name) updateData.fullName = name
      if (email) updateData.email = email
      if (Object.keys(updateData).length) {
        user = await prisma.user.update({ where: { id: user_id }, data: updateData })
      }
    }

    // Create client profile if not exists (use findFirst because userId is not unique in schema)
    let client = await prisma.client.findFirst({ where: { userId: user_id } })
    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: user_id,
          age: null,
          gender: null,
          goals: null,
        }
      })
    }

    return NextResponse.json({
      profile: {
        id: client.id,
        userId: client.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.isAdmin ? 'admin' : user.isTrainer ? 'trainer' : 'client',
        avatar_url: avatar_url || null,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    console.error('Profile API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { userId: userId },
      include: {
        user: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: client.id,
        userId: client.userId,
        fullName: client.user?.fullName,
        email: client.user?.email,
        role: client.user?.isAdmin ? 'admin' : client.user?.isTrainer ? 'trainer' : 'client',
        age: client.age,
        gender: client.gender,
        goals: client.goals,
        joinedAt: client.joinedAt
      }
    });
  } catch (err: any) {
    console.error('Profile API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
