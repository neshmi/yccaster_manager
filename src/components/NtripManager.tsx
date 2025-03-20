"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Trash, Edit, Save, X, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useYamlData } from '@/hooks/useYamlData';
import { User, Mountpoint } from '@/lib/utils/yaml';

const NtripManager = () => {
  // Function to generate a random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 12;
    let result = '';
    
    // Make sure we have at least one uppercase, one lowercase and one number
    result += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
    result += chars.charAt(Math.floor(Math.random() * 26) + 26); // Lowercase
    result += chars.charAt(Math.floor(Math.random() * 10) + 52); // Number
    
    // Fill the rest randomly
    for (let i = 3; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the result
    return result.split('').sort(() => 0.5 - Math.random()).join('');
  };
  
  // Password visibility states
  const [showMountpointPassword, setShowMountpointPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showEditPasswords, setShowEditPasswords] = useState<Record<string, boolean>>({});
  
  // Independent password states for display
  const [mountpointGeneratedPassword, setMountpointGeneratedPassword] = useState(generatePassword());
  const [userGeneratedPassword, setUserGeneratedPassword] = useState(generatePassword());
  
  // Toggle password visibility for a specific item
  const togglePasswordVisibility = (id: string, show: boolean) => {
    setShowEditPasswords(prev => ({
      ...prev,
      [id]: show
    }));
  };
  
  // Use our custom hook to load and save YAML data
  const { users: yamlUsers, mountpoints: yamlMountpoints, loading, error, saveUsers, saveMountpoints } = useYamlData();
  
  // State management for users and mountpoints
  const [mountpoints, setMountpoints] = useState<Mountpoint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Update state when YAML data loads
  useEffect(() => {
    if (yamlUsers && yamlUsers.length > 0) {
      setUsers(yamlUsers);
    }
    
    if (yamlMountpoints && yamlMountpoints.length > 0) {
      setMountpoints(yamlMountpoints);
    }
  }, [yamlUsers, yamlMountpoints]);

  // State for editing
  const [editingMountpoint, setEditingMountpoint] = useState<{ index: number; data: Mountpoint } | null>(null);
  const [editingUser, setEditingUser] = useState<{ index: number; data: User } | null>(null);

  // State for adding new items
  const [newMountpoint, setNewMountpoint] = useState({
    'mount-point': '',
    password: mountpointGeneratedPassword,
    description: {
      identifier: '',
      format: 'RTCM 3.2',
      'nav-system': 'GPS+GLONASS+GALILEO+BEIDOU',
      country: '',
      latitude: 0,
      longitude: 0,
      nmea: 1,
      generator: ''
    }
  });

  const [newUser, setNewUser] = useState({
    username: '',
    password: userGeneratedPassword
  });
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: 'mountpoint' | 'user'; index: number; name: string } | null>(null);

  // Function to handle mountpoint editing
  const handleEditMountpoint = (index: number) => {
    setEditingMountpoint({
      index,
      data: JSON.parse(JSON.stringify(mountpoints[index]))
    });
  };

  // Function to save edited mountpoint
  const handleSaveMountpoint = async () => {
    if (!editingMountpoint) return;
    
    try {
      const updatedMountpoints = [...mountpoints];
      updatedMountpoints[editingMountpoint.index] = editingMountpoint.data;
      
      // Save to YAML file via API
      const success = await saveMountpoints(updatedMountpoints);
      
      if (success) {
        setMountpoints(updatedMountpoints);
        setEditingMountpoint(null);
        console.log('Saved mountpoint:', editingMountpoint.data);
      } else {
        console.error('Failed to save mountpoint');
      }
    } catch (err) {
      console.error('Error saving mountpoint:', err);
    }
  };

  // Function to delete a mountpoint
  const handleDeleteMountpoint = (index: number) => {
    setItemToDelete({
      type: 'mountpoint',
      index,
      name: mountpoints[index]['mount-point']
    });
    setDeleteConfirmName('');
    setDeleteDialogOpen(true);
  };
  
  // Function to confirm and execute delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'mountpoint') {
        const updatedMountpoints = mountpoints.filter((_, i) => i !== itemToDelete.index);
        const success = await saveMountpoints(updatedMountpoints);
        
        if (success) {
          console.log('Deleted mountpoint:', mountpoints[itemToDelete.index]);
          setMountpoints(updatedMountpoints);
        } else {
          console.error('Failed to delete mountpoint');
        }
      } else if (itemToDelete.type === 'user') {
        const updatedUsers = users.filter((_, i) => i !== itemToDelete.index);
        const success = await saveUsers(updatedUsers);
        
        if (success) {
          console.log('Deleted user:', users[itemToDelete.index]);
          setUsers(updatedUsers);
        } else {
          console.error('Failed to delete user');
        }
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      // Reset delete state
      setDeleteDialogOpen(false);
      setDeleteConfirmName('');
      setItemToDelete(null);
    }
  };

  // Function to add new mountpoint
  const handleAddMountpoint = async () => {
    if (newMountpoint['mount-point']) {
      const updatedMountpoints = [...mountpoints, newMountpoint];
      
      try {
        const success = await saveMountpoints(updatedMountpoints);
        
        if (success) {
          setMountpoints(updatedMountpoints);
          
          // Reset the form
          setNewMountpoint({
            'mount-point': '',
            password: mountpointGeneratedPassword,
            description: {
              identifier: '',
              format: 'RTCM 3.2',
              'nav-system': 'GPS+GLONASS+GALILEO+BEIDOU',
              country: '',
              latitude: 0,
              longitude: 0,
              nmea: 1,
              generator: ''
            }
          });
          
          console.log('Added new mountpoint:', newMountpoint);
        } else {
          console.error('Failed to add mountpoint');
        }
      } catch (err) {
        console.error('Error adding mountpoint:', err);
      }
    }
  };

  // User management functions
  const handleEditUser = (index: number) => {
    setEditingUser({
      index,
      data: JSON.parse(JSON.stringify(users[index]))
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      const updatedUsers = [...users];
      updatedUsers[editingUser.index] = editingUser.data;
      
      // Save to YAML file via API
      const success = await saveUsers(updatedUsers);
      
      if (success) {
        setUsers(updatedUsers);
        setEditingUser(null);
        console.log('Saved user:', editingUser.data);
      } else {
        console.error('Failed to save user');
      }
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  // Function to delete a user
  const handleDeleteUser = (index: number) => {
    setItemToDelete({
      type: 'user',
      index,
      name: users[index].username
    });
    setDeleteConfirmName('');
    setDeleteDialogOpen(true);
  };

  const handleAddUser = async () => {
    if (newUser.username && newUser.password) {
      const updatedUsers = [...users, newUser];
      
      try {
        const success = await saveUsers(updatedUsers);
        
        if (success) {
          setUsers(updatedUsers);
          
          // Reset the form
          setNewUser({
            username: '',
            password: userGeneratedPassword
          });
          
          console.log('Added new user:', newUser);
        } else {
          console.error('Failed to add user');
        }
      } catch (err) {
        console.error('Error adding user:', err);
      }
    }
  };

  // UI rendering
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">NTRIP Manager</h1>
        <ThemeToggle />
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg">Loading data...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/20 p-4 rounded-md mb-6">
          <p className="text-destructive font-medium">Error loading data: {error}</p>
        </div>
      ) : (
        <>
          <Tabs defaultValue="users">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="mountpoints">Mountpoints</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            {/* Mountpoints Tab */}
            <TabsContent value="mountpoints">
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Random Password</CardTitle>
                    <CardDescription>Generate a secure random password that you can use for mountpoints or users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-3 rounded-md flex-1 font-mono border border-border">
                        {newUser.password}
                      </div>
                      <Button 
                        onClick={() => {
                          const password = generatePassword();
                          setNewUser({...newUser, password});
                          setNewMountpoint({...newMountpoint, password});
                          setShowUserPassword(true);
                          setShowMountpointPassword(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} /> Generate New
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Mountpoint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-mount-point">Mount Point</Label>
                          <Input 
                            id="new-mount-point" 
                            value={newMountpoint['mount-point']} 
                            onChange={(e) => setNewMountpoint({...newMountpoint, 'mount-point': e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-mount-password">Password</Label>
                          <div className="flex">
                            <div className="relative w-full">
                              <Input 
                                id="new-mount-password"
                                type={showMountpointPassword ? "text" : "password"}
                                value={newMountpoint.password} 
                                onChange={(e) => setNewMountpoint({...newMountpoint, password: e.target.value})}
                                className="pr-20"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  type="button"
                                  onClick={() => setShowMountpointPassword(!showMountpointPassword)}
                                  className="h-7 w-7"
                                >
                                  {showMountpointPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  type="button"
                                  onClick={() => setNewMountpoint({...newMountpoint, password: generatePassword()})}
                                  className="h-7 w-7 ml-1"
                                  title="Generate new password"
                                >
                                  <RefreshCw size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-identifier">Identifier</Label>
                          <Input 
                            id="new-identifier" 
                            value={newMountpoint.description.identifier} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, identifier: e.target.value}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-format">Format</Label>
                          <Input 
                            id="new-format" 
                            value={newMountpoint.description.format} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, format: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-nav-system">Nav System</Label>
                          <Input 
                            id="new-nav-system" 
                            value={newMountpoint.description['nav-system']} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, 'nav-system': e.target.value}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-country">Country</Label>
                          <Input 
                            id="new-country" 
                            value={newMountpoint.description.country} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, country: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-latitude">Latitude</Label>
                          <Input 
                            id="new-latitude" 
                            type="number"
                            step="0.001"
                            value={newMountpoint.description.latitude} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, latitude: parseFloat(e.target.value)}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-longitude">Longitude</Label>
                          <Input 
                            id="new-longitude" 
                            type="number"
                            step="0.001"
                            value={newMountpoint.description.longitude} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, longitude: parseFloat(e.target.value)}
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-nmea">NMEA</Label>
                          <Input 
                            id="new-nmea" 
                            type="number"
                            value={newMountpoint.description.nmea} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, nmea: parseInt(e.target.value)}
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-generator">Generator</Label>
                          <Input 
                            id="new-generator" 
                            value={newMountpoint.description.generator} 
                            onChange={(e) => setNewMountpoint({
                              ...newMountpoint, 
                              description: {...newMountpoint.description, generator: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleAddMountpoint}
                    >
                      <PlusCircle size={16} /> Add Mountpoint
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <h2 className="text-xl font-bold mb-4">Existing Mountpoints</h2>
              
              <div className="grid gap-4">
                {mountpoints.map((mountpoint, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{mountpoint['mount-point']}</CardTitle>
                      <CardDescription>Password: {mountpoint.password.replace(/./g, '•')}</CardDescription>
                    </CardHeader>
                    
                    {editingMountpoint !== null && editingMountpoint.index === index ? (
                      <CardContent>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-mount-point-${index}`}>Mount Point</Label>
                              <Input 
                                id={`edit-mount-point-${index}`}
                                value={editingMountpoint.data['mount-point']} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {...editingMountpoint.data, 'mount-point': e.target.value}
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-password-${index}`}>Password</Label>
                              <div className="relative w-full">
                                <Input 
                                  id={`edit-password-${index}`}
                                  type={showEditPasswords[`mountpoint-${index}`] ? "text" : "password"}
                                  value={editingMountpoint.data.password} 
                                  onChange={(e) => setEditingMountpoint({
                                    ...editingMountpoint, 
                                    data: {...editingMountpoint.data, password: e.target.value}
                                  })}
                                  className="pr-20"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    type="button"
                                    onClick={() => togglePasswordVisibility(`mountpoint-${index}`, !showEditPasswords[`mountpoint-${index}`])}
                                    className="h-7 w-7"
                                  >
                                    {showEditPasswords[`mountpoint-${index}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    type="button"
                                    onClick={() => setEditingMountpoint({
                                      ...editingMountpoint, 
                                      data: {...editingMountpoint.data, password: generatePassword()}
                                    })}
                                    className="h-7 w-7 ml-1"
                                    title="Generate new password"
                                  >
                                    <RefreshCw size={16} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-identifier-${index}`}>Identifier</Label>
                              <Input 
                                id={`edit-identifier-${index}`}
                                value={editingMountpoint.data.description.identifier} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      identifier: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-format-${index}`}>Format</Label>
                              <Input 
                                id={`edit-format-${index}`}
                                value={editingMountpoint.data.description.format} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      format: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-nav-system-${index}`}>Nav System</Label>
                              <Input 
                                id={`edit-nav-system-${index}`}
                                value={editingMountpoint.data.description['nav-system']} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      'nav-system': e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-country-${index}`}>Country</Label>
                              <Input 
                                id={`edit-country-${index}`}
                                value={editingMountpoint.data.description.country} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      country: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-latitude-${index}`}>Latitude</Label>
                              <Input 
                                id={`edit-latitude-${index}`}
                                type="number"
                                step="0.001"
                                value={editingMountpoint.data.description.latitude} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      latitude: parseFloat(e.target.value)
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-longitude-${index}`}>Longitude</Label>
                              <Input 
                                id={`edit-longitude-${index}`}
                                type="number"
                                step="0.001"
                                value={editingMountpoint.data.description.longitude} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      longitude: parseFloat(e.target.value)
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edit-nmea-${index}`}>NMEA</Label>
                              <Input 
                                id={`edit-nmea-${index}`}
                                type="number"
                                value={editingMountpoint.data.description.nmea} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      nmea: parseInt(e.target.value)
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-generator-${index}`}>Generator</Label>
                              <Input 
                                id={`edit-generator-${index}`}
                                value={editingMountpoint.data.description.generator} 
                                onChange={(e) => setEditingMountpoint({
                                  ...editingMountpoint, 
                                  data: {
                                    ...editingMountpoint.data, 
                                    description: {
                                      ...editingMountpoint.data.description, 
                                      generator: e.target.value
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent>
                        <div className="space-y-2">
                          <p><strong>Identifier:</strong> {mountpoint.description.identifier}</p>
                          <p><strong>Format:</strong> {mountpoint.description.format}</p>
                          <p><strong>Nav System:</strong> {mountpoint.description['nav-system']}</p>
                          <p><strong>Country:</strong> {mountpoint.description.country}</p>
                          <p><strong>Coordinates:</strong> {mountpoint.description.latitude}, {mountpoint.description.longitude}</p>
                          <p><strong>NMEA:</strong> {mountpoint.description.nmea}</p>
                          <p><strong>Generator:</strong> {mountpoint.description.generator}</p>
                        </div>
                      </CardContent>
                    )}
                    
                    <CardFooter className="flex justify-end gap-2">
                      {editingMountpoint !== null && editingMountpoint.index === index ? (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingMountpoint(null)}
                            className="flex items-center gap-1"
                          >
                            <X size={16} /> Cancel
                          </Button>
                          <Button 
                            onClick={handleSaveMountpoint}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                          >
                            <Save size={16} /> Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => handleEditMountpoint(index)}
                            className="flex items-center gap-1"
                          >
                            <Edit size={16} /> Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                            onClick={() => handleDeleteMountpoint(index)}
                          >
                            <Trash size={16} /> Delete
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Random Password</CardTitle>
                    <CardDescription>Generate a secure random password for users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-3 rounded-md flex-1 font-mono border border-border">
                        {userGeneratedPassword}
                      </div>
                      <Button 
                        onClick={() => {
                          const password = generatePassword();
                          setUserGeneratedPassword(password);
                          setNewUser({...newUser, password});
                          setShowUserPassword(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} /> Generate New
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-username">Username</Label>
                        <Input 
                          id="new-username" 
                          value={newUser.username} 
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-user-password">Password</Label>
                        <Input 
                          id="new-user-password"
                          type="password"
                          value={newUser.password} 
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleAddUser}
                    >
                      <PlusCircle size={16} /> Add User
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <h2 className="text-xl font-bold mb-4">Existing Users</h2>
              
              <div className="grid gap-4">
                {users.map((user, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{user.username}</CardTitle>
                    </CardHeader>
                    
                    {editingUser !== null && editingUser.index === index ? (
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`edit-username-${index}`}>Username</Label>
                            <Input 
                              id={`edit-username-${index}`}
                              value={editingUser.data.username} 
                              onChange={(e) => setEditingUser({
                                ...editingUser, 
                                data: {...editingUser.data, username: e.target.value}
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-user-password-${index}`}>Password</Label>
                            <div className="relative w-full">
                              <Input 
                                id={`edit-user-password-${index}`}
                                type={showEditPasswords[`user-${index}`] ? "text" : "password"}
                                value={editingUser.data.password} 
                                onChange={(e) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, password: e.target.value}
                                })}
                                className="pr-20"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  type="button"
                                  onClick={() => togglePasswordVisibility(`user-${index}`, !showEditPasswords[`user-${index}`])}
                                  className="h-7 w-7"
                                >
                                  {showEditPasswords[`user-${index}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  type="button"
                                  onClick={() => {
                                    const password = generatePassword();
                                    setEditingUser({
                                      ...editingUser, 
                                      data: {...editingUser.data, password}
                                    });
                                    togglePasswordVisibility(`user-${index}`, true);
                                  }}
                                  className="h-7 w-7 ml-1"
                                  title="Generate new password"
                                >
                                  <RefreshCw size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent>
                        <div className="flex items-center">
                          <p><strong>Password:</strong> {user.password.replace(/./g, '•')}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              const newState = {...showEditPasswords};
                              newState[`user-view-${index}`] = !showEditPasswords[`user-view-${index}`];
                              setShowEditPasswords(newState);
                            }}
                            className="h-8 w-8 ml-2"
                          >
                            {showEditPasswords[`user-view-${index}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                          {showEditPasswords[`user-view-${index}`] && (
                            <span className="ml-2">{user.password}</span>
                          )}
                        </div>
                      </CardContent>
                    )}
                    
                    <CardFooter className="flex justify-end gap-2">
                      {editingUser !== null && editingUser.index === index ? (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingUser(null)}
                            className="flex items-center gap-1"
                          >
                            <X size={16} /> Cancel
                          </Button>
                          <Button 
                            onClick={handleSaveUser}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                          >
                            <Save size={16} /> Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => handleEditUser(index)}
                            className="flex items-center gap-1"
                          >
                            <Edit size={16} /> Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                            onClick={() => handleDeleteUser(index)}
                          >
                            <Trash size={16} /> Delete
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. To confirm deletion, please type <strong>{itemToDelete?.name}</strong> below.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-y-2 py-4">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="confirm-name" className="sr-only">
                    Type name to confirm
                  </Label>
                  <Input
                    id="confirm-name"
                    placeholder={`Type ${itemToDelete?.name} to confirm`}
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setDeleteConfirmName('');
                    setItemToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteConfirmName !== itemToDelete?.name}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete {itemToDelete?.type}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default NtripManager;