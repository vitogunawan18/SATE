import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth-token';
import { verifyPassword, hashPassword } from '@/lib/auth-pass';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Belum masuk / Sesi berakhir' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sesi tidak valid atau kedaluwarsa' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan password baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ username: payload.username });
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const isOldPasswordCorrect = verifyPassword(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 });
    }

    const hashedNew = hashPassword(newPassword);
    await db.collection('users').updateOne(
      { username: payload.username },
      { $set: { password: hashedNew, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
