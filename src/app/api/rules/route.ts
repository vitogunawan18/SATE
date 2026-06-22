import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth-token';

// Helper to check admin role
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const rules = await db.collection('rules').find({}).toArray();

    // Sort by stage then by rule_id (e.g. H1, H2, P1, P2)
    rules.sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.rule_id.localeCompare(b.rule_id, undefined, { numeric: true, sensitivity: 'base' });
    });

    const formattedRules = rules.map((r) => ({
      rule_id: r.rule_id,
      stage: r.stage,
      description: r.description,
      conditions: r.conditions,
      conclusion: r.conclusion,
      cf: r.cf,
    }));

    return NextResponse.json({ success: true, data: formattedRules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { rule_id, stage, description, conditions, conclusion, cf } = body;

    if (!rule_id || !stage || !conditions || !conclusion || cf === undefined) {
      return NextResponse.json({ error: 'Format data aturan tidak lengkap' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if rule_id already exists
    const existing = await db.collection('rules').findOne({ rule_id });
    if (existing) {
      return NextResponse.json({ error: `Rule ID ${rule_id} sudah ada` }, { status: 409 });
    }

    const newRule = {
      rule_id,
      stage: Number(stage),
      description,
      conditions,
      conclusion,
      cf: Number(cf),
      createdAt: new Date(),
    };

    await db.collection('rules').insertOne(newRule);

    return NextResponse.json({ success: true, message: 'Aturan berhasil dibuat', data: newRule });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { rule_id, stage, description, conditions, conclusion, cf } = body;

    if (!rule_id) {
      return NextResponse.json({ error: 'Rule ID wajib disertakan untuk update' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const updateData: any = {};
    if (stage !== undefined) updateData.stage = Number(stage);
    if (description !== undefined) updateData.description = description;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (conclusion !== undefined) updateData.conclusion = conclusion;
    if (cf !== undefined) updateData.cf = Number(cf);
    updateData.updatedAt = new Date();

    const result = await db.collection('rules').updateOne({ rule_id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Aturan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Aturan berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rule_id = searchParams.get('rule_id');

    if (!rule_id) {
      return NextResponse.json({ error: 'Rule ID wajib disertakan untuk menghapus' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('rules').deleteOne({ rule_id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Aturan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Aturan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
