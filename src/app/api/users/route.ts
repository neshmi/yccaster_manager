import { NextResponse } from 'next/server';
import { readUsers, writeUsers, User } from '@/lib/utils/yaml';

export async function GET() {
  try {
    const users = await readUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const users = await request.json() as User[];
    const success = await writeUsers(users);
    
    if (success) {
      return NextResponse.json({ message: 'Users updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update users' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating users:', error);
    return NextResponse.json({ error: 'Failed to update users' }, { status: 500 });
  }
}