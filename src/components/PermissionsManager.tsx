import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axiosInstance from '@/lib/api';
import {
  Shield,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

type UserRole = 'admin' | 'gerente' | 'vendedor';
type ModuleName =
  | 'dashboard'
  | 'vendas'
  | 'estoque'
  | 'financeiro'
  | 'produtos'
  | 'clientes'
  | 'fornecedores'
  | 'vendedores'
  | 'caixa'
  | 'relatorios'
  | 'vitrine'
  | 'usuarios';

type Action = 'view' | 'create' | 'edit' | 'delete' | 'export';

interface Permission {
  _id?: string;
  role: UserRole;
  module: ModuleName;
  actions: Action[];
}

const moduleLabels: Record<ModuleName, string> = {
  dashboard: 'Dashboard',
  vendas: 'Vendas',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  produtos: 'Produtos',
  clientes: 'Clientes',
  fornecedores: 'Fornecedores',
  vendedores: 'Vendedores',
  caixa: 'Caixa',
  relatorios: 'Relatórios',
  vitrine: 'Vitrine Virtual',
  usuarios: 'Usuários'
};

const actionLabels: Record<Action, { label: string; icon: any }> = {
  view: { label: 'Visualizar', icon: Eye },
  create: { label: 'Criar', icon: Plus },
  edit: { label: 'Editar', icon: Edit },
  delete: { label: 'Excluir', icon: Trash2 },
  export: { label: 'Exportar', icon: Download }
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  vendedor: 'Vendedor'
};

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('gerente');

  const modules: ModuleName[] = [
    'dashboard',
    'vendas',
    'estoque',
    'financeiro',
    'produtos',
    'clientes',
    'fornecedores',
    'vendedores',
    'caixa',
    'relatorios',
    'vitrine',
    'usuarios'
  ];

  const actions: Action[] = ['view', 'create', 'edit', 'delete', 'export'];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<Permission[]>('/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  const getPermission = (role: UserRole, module: ModuleName): Permission => {
    return (
      permissions.find((p) => p.role === role && p.module === module) || {
        role,
        module,
        actions: []
      }
    );
  };

  const hasAction = (role: UserRole, module: ModuleName, action: Action): boolean => {
    const permission = getPermission(role, module);
    return permission.actions.includes(action);
  };

  const toggleAction = (role: UserRole, module: ModuleName, action: Action) => {
    setPermissions((prev) => {
      const existingIndex = prev.findIndex(
        (p) => p.role === role && p.module === module
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const current = updated[existingIndex];
        
        if (current.actions.includes(action)) {
          current.actions = current.actions.filter((a) => a !== action);
        } else {
          current.actions = [...current.actions, action];
        }
        
        return updated;
      } else {
        return [...prev, { role, module, actions: [action] }];
      }
    });
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      
      const rolePermissions = permissions.filter((p) => p.role === selectedRole);
      
      await axiosInstance.post('/permissions/batch', {
        permissions: rolePermissions
      });

      toast.success('Permissões salvas com sucesso!');
      loadPermissions();
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const initializeDefaults = async (role: UserRole) => {
    try {
      setSaving(true);
      await axiosInstance.post(`/permissions/initialize/${role}`);
      toast.success('Permissões padrão inicializadas!');
      loadPermissions();
    } catch (error) {
      console.error('Erro ao inicializar permissões:', error);
      toast.error('Erro ao inicializar permissões');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Gerenciamento de Permissões</CardTitle>
              <CardDescription>
                Configure o que cada role pode acessar no sistema
              </CardDescription>
            </div>
          </div>
          <Button onClick={savePermissions} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="gerente">
              {roleLabels.gerente}
            </TabsTrigger>
            <TabsTrigger value="vendedor">
              {roleLabels.vendedor}
            </TabsTrigger>
            <TabsTrigger value="admin" disabled>
              {roleLabels.admin} <Lock className="h-3 w-3 ml-1" />
            </TabsTrigger>
          </TabsList>

          {(['gerente', 'vendedor'] as UserRole[]).map((role) => (
            <TabsContent key={role} value={role} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{roleLabels[role]}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Configure as permissões para esta role
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => initializeDefaults(role)}
                  disabled={saving}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restaurar Padrões
                </Button>
              </div>

              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Módulo</th>
                      {actions.map((action) => {
                        const ActionIcon = actionLabels[action].icon;
                        return (
                          <th key={action} className="text-center p-3">
                            <div className="flex flex-col items-center gap-1">
                              <ActionIcon className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                {actionLabels[action].label}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => (
                      <tr key={module} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          {moduleLabels[module]}
                        </td>
                        {actions.map((action) => (
                          <td key={action} className="text-center p-3">
                            <Checkbox
                              checked={hasAction(role, module, action)}
                              onCheckedChange={() => toggleAction(role, module, action)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Sobre as Permissões
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Visualizar:</strong> Ver dados do módulo
                </li>
                <li>
                  <strong>Criar:</strong> Adicionar novos registros
                </li>
                <li>
                  <strong>Editar:</strong> Modificar registros existentes
                </li>
                <li>
                  <strong>Excluir:</strong> Remover registros
                </li>
                <li>
                  <strong>Exportar:</strong> Exportar dados (PDF, Excel, etc)
                </li>
                <li>
                  <strong>Admin:</strong> Tem acesso total e não pode ser modificado
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
