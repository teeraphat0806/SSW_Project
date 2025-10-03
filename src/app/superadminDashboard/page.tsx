'use client'
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../../contexts/Authcontext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Shield, Users, Edit, Trash2, LogOut, } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ToastContainer, toast } from 'react-toastify';
import {  signOut } from 'next-auth/react'
const roleColors: Record<UserRole, string> = {
  superadmin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  guest: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  clerk: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  supervisor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cutter: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export default function SuperadminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/user',{}).then(res => res.json());
      if (!res) throw new Error('No users found');
      setUsers(res || []);
    } catch (error) {
      toast.error(`Error fetching users: ${error}`, {
        position: 'bottom-right',
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/auth/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
    });
      const { error } = await res.json();
      if (error) throw error;

      await fetchUsers();
      toast.success(`เปลี่ยนตำแหน่งเป็น ${newRole} สำเร็จ`, {
        position: 'bottom-right',
        });
    } catch (error) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${error}`, {
        position: 'bottom-right',
        });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('คุณแน่ใจแล้วใช่ไหมที่จะลบ ผู้ใช้งาน? ไม่สามารถย้อนกลับได้')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/auth/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const { error } = await res.json();
      if (error) throw error;

      await fetchUsers();
      toast.success('ลบ ผู้ใช้งานสำเร็จ', {
        position: 'bottom-right',
        });
    } catch (error) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${error}`, {
        position: 'bottom-right',
        });
    }
  };

  const getUserStats = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);
    
    return stats;
  };

  const stats = getUserStats();

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Superadmin Dashboard</h1>
              <p className="text-muted-foreground">ระบบควบคุม การให้สิทธิ์</p>
            </div>
          </div>
          <Button variant="outline" onClick={()=>signOut({callbackUrl: '/'})} className="flex items-center space-x-2 bg-red-500 text-white border-none hover:bg-red-600 hover:cursor-pointer hover:scale-110 transition-all">
            <LogOut className="h-4 w-4 " />
            <span>ออกจากระบบ</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(roleColors).map(([role, colorClass]) => (
            <Card key={role}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold mb-1">{stats[role as UserRole] || 0}</div>
                <Badge className={colorClass}>{role}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>สร้างเมื่อ</TableHead>
                    <TableHead>เปลี่ยนสิทธิ์</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                className='bg-blue-500 text-white hover:bg-blue-600 border-none hover:cursor-pointer hover:scale-110 transition-all'
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>แก้ไขสิทธิ์</DialogTitle>
                              </DialogHeader>
                              {editingUser && (
                                <div className="space-y-4">
                                  <div>
                                    <Label>ชื่อ</Label>
                                    <Input value={editingUser.name || ''} disabled />
                                  </div>
                                  <div>
                                    <Label>อีเมล</Label>
                                    <Input value={editingUser.email} disabled />
                                  </div>
                                  <div>
                                    <Label>ตำแหน่ง</Label>
                                    <Select
                                      value={editingUser.role}
                                      onValueChange={(value) => {
                                        handleRoleUpdate(editingUser.id, value as UserRole);
                                        setIsDialogOpen(false);
                                        setEditingUser(null);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.keys(roleColors).map((role) => (
                                          <SelectItem key={role} value={role}>
                                            {role}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            className='hover:bg-red-600 hover:text-white hover:cursor-pointer hover:scale-110 transition-all'
                            onClick={() => handleDeleteUser(Number(user.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <ToastContainer />
    </div>
  );
}