import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth-token';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID kandidat diperlukan' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const candidate = await db.collection('candidates').findOne({ id });

    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: candidate.id || candidate._id.toString(),
        tanggal: (() => {
          let tanggalDisplay = candidate.tanggal;
          if (candidate.createdAt) {
            try {
              const date = new Date(candidate.createdAt);
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
              console.error('Error formatting createdAt for candidate detail:', candidate.id, e);
            }
          }
          return tanggalDisplay;
        })(),
        facts: candidate.facts,
        result: candidate.result,
        hrd_name: candidate.hrd_name || 'HR Manager',
        company_name: candidate.company_name || 'PT Sinar Agung Terang F&B',
        outlet_name: candidate.outlet_name || 'Kantor Pusat',
      },
    });
  } catch (error: any) {
    console.error('Error fetching candidate by id:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
