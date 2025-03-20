import { NextResponse } from 'next/server';
import { readMountpoints, writeMountpoints, Mountpoint } from '@/lib/utils/yaml';

export async function GET() {
  try {
    const mountpoints = await readMountpoints();
    return NextResponse.json(mountpoints);
  } catch (error) {
    console.error('Error fetching mountpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch mountpoints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const mountpoints = await request.json() as Mountpoint[];
    const success = await writeMountpoints(mountpoints);
    
    if (success) {
      return NextResponse.json({ message: 'Mountpoints updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update mountpoints' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating mountpoints:', error);
    return NextResponse.json({ error: 'Failed to update mountpoints' }, { status: 500 });
  }
}