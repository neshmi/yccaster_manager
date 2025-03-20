import { useState, useEffect } from 'react';
import { User, Mountpoint } from '@/lib/utils/yaml';

interface UseYamlDataReturn {
  users: User[];
  mountpoints: Mountpoint[];
  loading: boolean;
  error: string | null;
  saveUsers: (users: User[]) => Promise<boolean>;
  saveMountpoints: (mountpoints: Mountpoint[]) => Promise<boolean>;
}

export function useYamlData(): UseYamlDataReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [mountpoints, setMountpoints] = useState<Mountpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Fetch mountpoints
        const mountpointsResponse = await fetch('/api/mountpoints');
        if (!mountpointsResponse.ok) {
          throw new Error(`Failed to fetch mountpoints: ${mountpointsResponse.statusText}`);
        }
        const mountpointsData = await mountpointsResponse.json();
        setMountpoints(mountpointsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const saveUsers = async (updatedUsers: User[]): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUsers),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save users: ${response.statusText}`);
      }
      
      setUsers(updatedUsers);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error saving users:', err);
      return false;
    }
  };

  const saveMountpoints = async (updatedMountpoints: Mountpoint[]): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/mountpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMountpoints),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save mountpoints: ${response.statusText}`);
      }
      
      setMountpoints(updatedMountpoints);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error saving mountpoints:', err);
      return false;
    }
  };

  return { users, mountpoints, loading, error, saveUsers, saveMountpoints };
}