import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth-token';
import { runInference } from '@/lib/inference-engine';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const candidates = await db
      .collection('candidates')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Map _id to string id and format tanggal with time from createdAt if available
    const formattedCandidates = candidates.map((cand) => {
      let tanggalDisplay = cand.tanggal;
      if (cand.createdAt) {
        try {
          const date = new Date(cand.createdAt);
          if (!isNaN(date.getTime())) {
            const formatter = new Intl.DateTimeFormat('id-ID', {
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            const parts = formatter.formatToParts(date);
            const day = parts.find(p => p.type === 'day')?.value;
            const month = parts.find(p => p.type === 'month')?.value;
            const year = parts.find(p => p.type === 'year')?.value;
            const hour = parts.find(p => p.type === 'hour')?.value;
            const minute = parts.find(p => p.type === 'minute')?.value;
            tanggalDisplay = `${year}-${month}-${day} ${hour}:${minute}`;
          }
        } catch (e) {
          console.error('Error formatting createdAt for candidate:', cand.id, e);
        }
      }

      return {
        id: cand.id || cand._id.toString(),
        tanggal: tanggalDisplay,
        facts: cand.facts,
        result: cand.result,
        hrd_name: cand.hrd_name || 'HR Manager',
        company_name: cand.company_name || 'PT Sinar Agung Terang F&B',
        outlet_name: cand.outlet_name || 'Kantor Pusat',
      };
    });

    return NextResponse.json({ success: true, data: formattedCandidates });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { facts, hrd_name, company_name, outlet_name } = body;

    if (!facts || !facts.nama) {
      return NextResponse.json({ error: 'Data fakta kandidat tidak valid' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch dynamic rules from database
    const dbRules = await db.collection('rules').find({}).toArray() as any;
    const formattedRules = dbRules.map((r: any) => ({
      rule_id: r.rule_id,
      stage: r.stage,
      description: r.description,
      conditions: r.conditions,
      conclusion: r.conclusion,
      cf: r.cf,
    }));

    // Run the expert system inference engine on the server with dynamic rules
    const result = runInference(facts, formattedRules.length > 0 ? formattedRules : undefined);

    const newCandidate = {
      id: 'cand-' + Date.now() + Math.random().toString(36).slice(2, 6),
      tanggal: (() => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const parts = formatter.formatToParts(now);
        const day = parts.find(p => p.type === 'day')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const year = parts.find(p => p.type === 'year')?.value;
        const hour = parts.find(p => p.type === 'hour')?.value;
        const minute = parts.find(p => p.type === 'minute')?.value;
        return `${year}-${month}-${day} ${hour}:${minute}`;
      })(),
      facts,
      result,
      hrd_name: hrd_name || payload.name,
      company_name: company_name || 'PT Sinar Agung Terang F&B',
      outlet_name: outlet_name || 'Kantor Pusat',
      createdAt: new Date(),
    };

    await db.collection('candidates').insertOne(newCandidate);

    return NextResponse.json({ success: true, data: newCandidate });
  } catch (error: any) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kandidat diperlukan' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const deleteResult = await db.collection('candidates').deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Data kandidat berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
