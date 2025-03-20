import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Define the data directory path
const DATA_DIR = path.join(process.cwd(), 'data');

// Types for our data
export interface User {
  username: string;
  password: string;
}

export interface MountpointDescription {
  identifier: string;
  format: string;
  'nav-system': string;
  country: string;
  latitude: number;
  longitude: number;
  nmea: number;
  generator: string;
}

export interface Mountpoint {
  'mount-point': string;
  password: string;
  description: MountpointDescription;
}

// Function to read users from clients.yml
export async function readUsers(): Promise<User[]> {
  try {
    const filePath = path.join(DATA_DIR, 'clients.yml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const users = yaml.load(fileContents) as User[];
    return users || [];
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Function to write users to clients.yml
export async function writeUsers(users: User[]): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, 'clients.yml');
    const yamlStr = yaml.dump(users);
    fs.writeFileSync(filePath, yamlStr, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users:', error);
    return false;
  }
}

// Function to read mountpoints from mountpoints.yml
export async function readMountpoints(): Promise<Mountpoint[]> {
  try {
    const filePath = path.join(DATA_DIR, 'mountpoints.yml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const mountpoints = yaml.load(fileContents) as Mountpoint[];
    return mountpoints || [];
  } catch (error) {
    console.error('Error reading mountpoints:', error);
    return [];
  }
}

// Function to write mountpoints to mountpoints.yml
export async function writeMountpoints(mountpoints: Mountpoint[]): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, 'mountpoints.yml');
    const yamlStr = yaml.dump(mountpoints);
    fs.writeFileSync(filePath, yamlStr, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing mountpoints:', error);
    return false;
  }
}