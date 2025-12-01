import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axiosInstance from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ShieldAlert, ShieldCheck, UserCog, Users, UserPlus, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";

type UserRole = 'admin' | 'gerente' | 'vendedor';

interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  codigoVendedor?: string;
  ativo: boolean;
  dataCriacao: string;
  ultimoAcesso?: string;
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

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'todos'>('todos');

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // ========== QUERY USERS ==========
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axiosInstance.get<{ success: boolean; count: number; users: User[] }>('/auth/users');
      return response.data.users;
    }
  });

  // ========== FILTROS E BUSCA ==========
  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];

    return list.filter(user => {
      // Filtro de busca (nome ou email)
      const matchesSearch = searchTerm === '' || 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de role
      const matchesRole = roleFilter === 'todos' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // ========== MUTATIONS ==========
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, codigoVendedor }: { userId: string; role: UserRole; codigoVendedor?: string }) => {
      const response = await axiosInstance.put(`/auth/users/${userId}/role`, { role, codigoVendedor });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role atualizada com sucesso!');
      setEditingRole(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar role');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.put(`/auth/users/${userId}/toggle-status`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status');
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const response = await axiosInstance.post('/auth/register', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setNewUser({ email: '', password: '', nome: '', role: 'vendedor', codigoVendedor: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar usuário');
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
            <Users className="h-8 w-8" /> Gerenciamento do Sistema
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários e permissões do sistema</p>
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

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filtros e Busca */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={(value: UserRole | 'todos') => setRoleFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os perfis</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Usuários Cadastrados</CardTitle>
          <CardDescription>
            {filteredUsers.length === (Array.isArray(users) ? users.length : filteredUsers.length)
              ? `Total de ${filteredUsers.length} usuário(s) no sistema`
              : `Mostrando ${filteredUsers.length} de ${(Array.isArray(users) ? users.length : filteredUsers.length)} usuário(s)`
            }
          </CardDescription>
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {editingRole === user.id ? (
                          <div className="flex gap-2">
                            <Select defaultValue={user.role} onValueChange={(value: UserRole) => updateRoleMutation.mutate({ userId: user.id, role: value, codigoVendedor: user.codigoVendedor })}>
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
                      <TableCell className="text-sm text-muted-foreground">{formatDate(user.ultimoAcesso)}</TableCell>
                      <TableCell>
                        <Button 
                          variant={user.ativo ? "destructive" : "default"} 
                          size="sm" 
                          onClick={() => toggleStatusMutation.mutate(user.id)} 
                          disabled={toggleStatusMutation.isPending}
                        >
                          {user.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Usuarios;
