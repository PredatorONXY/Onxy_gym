// src/app/api/diet-charts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const active = searchParams.get('active');

    let whereClause: any = {};

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (active !== null) {
      whereClause.active = active === 'true';
    }

    const dietCharts = await prisma.dietChart.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform to match the expected format
    const transformedCharts = dietCharts.map(chart => ({
      id: chart.id,
      title: chart.title,
      description: chart.description,
      client_id: chart.clientId,
      client_name: chart.client?.user?.fullName || 'Unknown Client',
      active: chart.active,
      meals: chart.meals,
      createdAt: chart.createdAt,
      updatedAt: chart.updatedAt
    }));

    return NextResponse.json({ dietCharts: transformedCharts });
  } catch (err: any) {
    console.error('Diet charts API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, client_id, client_name, active, meals } = body;

    if (!title || !client_id) {
      return NextResponse.json({ error: 'Title and client_id are required' }, { status: 400 });
    }

    const dietChart = await prisma.dietChart.create({
      data: {
        title,
        description,
        clientId: client_id,
        active: active ?? true,
        meals: meals || {}
      }
    });

    return NextResponse.json({ dietChart });
  } catch (err: any) {
    console.error('Create diet chart API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, client_id, client_name, active, meals } = body;

    if (!id || !title || !client_id) {
      return NextResponse.json({ error: 'ID, title and client_id are required' }, { status: 400 });
    }

    const dietChart = await prisma.dietChart.update({
      where: { id },
      data: {
        title,
        description,
        clientId: client_id,
        active: active ?? true,
        meals: meals || {},
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ dietChart });
  } catch (err: any) {
    console.error('Update diet chart API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    await prisma.dietChart.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete diet chart API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
