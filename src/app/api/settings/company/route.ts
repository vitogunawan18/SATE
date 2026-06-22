import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth-token';

const DEFAULT_COMPANY_INFO = {
  company_name: 'PT Sinar Agung Terang F&B',
  address: 'Gedung Sinar Agung, Lantai 5, Jl. H.R. Rasuna Said Kav. B-10, Jakarta Selatan 12920',
  phone: '(021) 520-4567',
  email: 'hr@sinaragungterang.co.id',
  website: 'www.sinaragungterang.co.id',
  logo: '',
  outlet_name: 'Kantor Pusat',
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const settings = await db.collection('settings').findOne({ key: 'company_info' });

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_COMPANY_INFO,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        company_name: settings.company_name || DEFAULT_COMPANY_INFO.company_name,
        address: settings.address || DEFAULT_COMPANY_INFO.address,
        phone: settings.phone || DEFAULT_COMPANY_INFO.phone,
        email: settings.email || DEFAULT_COMPANY_INFO.email,
        website: settings.website || DEFAULT_COMPANY_INFO.website,
        logo: settings.logo || DEFAULT_COMPANY_INFO.logo,
        outlet_name: settings.outlet_name || DEFAULT_COMPANY_INFO.outlet_name,
      },
    });
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { company_name, address, phone, email, website, logo, outlet_name } = body;

    if (!company_name || !company_name.trim()) {
      return NextResponse.json({ error: 'Nama perusahaan wajib diisi' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const updatedData = {
      key: 'company_info',
      company_name: company_name.trim(),
      address: (address || '').trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      website: (website || '').trim(),
      logo: logo || '',
      outlet_name: (outlet_name || 'Kantor Pusat').trim(),
      updatedAt: new Date(),
    };

    await db.collection('settings').updateOne(
      { key: 'company_info' },
      { $set: updatedData },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Informasi perusahaan berhasil disimpan',
      data: updatedData,
    });
  } catch (error: any) {
    console.error('Error saving company settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
