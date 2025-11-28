import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ShieldAlert, ShieldCheck, UserCog, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type UserRole = 'admin' | 'gerente' | 'vendedor';

interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  codigoVendedor?: string;
  ativo: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

interface NewUser {
  email: string;
  password: string;
  nome: string;
  role: UserRole;
  codigoVendedor?: string;
}

const Usuarios = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    nome: '',
    role: 'vendedor',
    codigoVendedor: ''
  });

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ========== QUERY USERS ==========
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const userEmails: Record<string, { email: string; last_sign_in_at?: string }> = {};
      
      for (const profile of profiles) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
          if (userData.user) {
            userEmails[profile.id] = {
              email: userData.user.email || '',
              last_sign_in_at: userData.user.last_sign_in_at
            };
          }
        } catch (error) {
          console.error(`Erro ao buscar dados do usuário ${profile.id}:`, error);
          userEmails[profile.id] = { email: 'Erro ao carregar email' };
        }
      }

      const usersData: User[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        const authData = userEmails[profile.id];
        
        return {
          id: profile.id,
          email: authData?.email || '',
          nome: profile.nome,
          role: (userRole?.role || 'vendedor') as UserRole,
          codigoVendedor: profile.codigo_vendedor,
          ativo: profile.ativo,
          created_at: profile.created_at,
          last_sign_in_at: authData?.last_sign_in_at
        };
      });

      return usersData;
    }
  });

  // ========== MUTATIONS ==========
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role atualizada com sucesso!');
      setEditingRole(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar role');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: userData.nome,
            role: userData.role,
            codigo_vendedor: userData.codigoVendedor
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar usuário');

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setNewUser({ email: '', password: '', nome: '', role: 'vendedor', codigoVendedor: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar usuário');
    }
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.nome) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (newUser.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newUser.role === 'vendedor' && !newUser.codigoVendedor) {
      toast.error('Código de vendedor é obrigatório para role "vendedor"');
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="gap-1"><ShieldAlert className="h-3 w-3" /> Admin</Badge>;
      case 'gerente':
        return <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Gerente</Badge>;
      case 'vendedor':
        return <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> Vendedor</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" /> Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários, roles e permissões do sistema</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Criar Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha as informações para criar um novo usuário no sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'vendedor' && (
                <div className="space-y-2">
                  <Label htmlFor="codigoVendedor">Código do Vendedor *</Label>
                  <Input id="codigoVendedor" value={newUser.codigoVendedor} onChange={(e) => setNewUser({ ...newUser, codigoVendedor: e.target.value })} placeholder="V001" />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Usuários Cadastrados</CardTitle>
          <CardDescription>Total de {users.length} usuário(s) no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Código Vendedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingRole === user.id ? (
                        <div className="flex gap-2">
                          <Select defaultValue={user.role} onValueChange={(value: UserRole) => updateRoleMutation.mutate({ userId: user.id, role: value })}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendedor">Vendedor</SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => setEditingRole(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">{getRoleBadge(user.role)} <Button variant="ghost" size="sm" onClick={() => setEditingRole(user.id)}>Editar</Button></div>
                      )}
                    </TableCell>
                    <TableCell>{user.codigoVendedor || '-'}</TableCell>
                    <TableCell>{user.ativo ? <Badge variant="default">Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.last_sign_in_at)}</TableCell>
                    <TableCell>
                      <Button 
                        variant={user.ativo ? "destructive" : "default"} 
                        size="sm" 
                        onClick={() => toggleStatusMutation.mutate({ userId: user.id, currentStatus: user.ativo })} 
                        disabled={toggleStatusMutation.isPending}
                      >
                        {user.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Usuarios;
