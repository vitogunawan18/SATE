import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, signToken } from '@/lib/auth-token';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Belum masuk / Sesi berakhir' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Sesi tidak valid atau kedaluwarsa' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: payload.userId,
        username: payload.username,
        name: payload.name,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error('Error during fetch user session:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Belum masuk / Sesi berakhir' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Sesi tidak valid atau kedaluwarsa' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Update user in the database
    const updateResult = await db.collection('users').updateOne(
      { _id: new ObjectId(payload.userId) },
      { $set: { name: name.trim() } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Re-sign token with updated name
    const newToken = await signToken({
      userId: payload.userId,
      username: payload.username,
      name: name.trim(),
      role: payload.role,
    });

    // Set updated session token in cookies
    cookieStore.set({
      name: 'session_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return NextResponse.json({
      success: true,
      message: 'Profil nama berhasil diperbarui',
      user: {
        userId: payload.userId,
        username: payload.username,
        name: name.trim(),
        role: payload.role,
      },
    });
  } catch (error) {
    console.error('Error updating user profile name:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
