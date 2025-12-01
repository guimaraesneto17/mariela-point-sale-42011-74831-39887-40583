import { useState, useEffect } from "react";
import { Shield, Save, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { permissoesAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type Action = 'view' | 'create' | 'edit' | 'delete' | 'export';
type Role = 'gerente' | 'vendedor';

interface ModulePermissions {
  [key: string]: Action[];
}

interface PermissionsState {
  gerente: ModulePermissions;
  vendedor: ModulePermissions;
}

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Visão geral e métricas' },
  { id: 'vendas', name: 'Vendas', description: 'Gerenciar vendas e transações' },
  { id: 'produtos', name: 'Produtos', description: 'Catálogo de produtos' },
  { id: 'estoque', name: 'Estoque', description: 'Controle de inventário' },
  { id: 'clientes', name: 'Clientes', description: 'Base de clientes' },
  { id: 'fornecedores', name: 'Fornecedores', description: 'Gerenciar fornecedores' },
  { id: 'vendedores', name: 'Vendedores', description: 'Equipe de vendas' },
  { id: 'financeiro', name: 'Financeiro', description: 'Contas a pagar e receber' },
  { id: 'caixa', name: 'Caixa', description: 'Controle de caixa' },
  { id: 'relatorios', name: 'Relatórios', description: 'Relatórios e análises' },
  { id: 'vitrine', name: 'Vitrine Virtual', description: 'Loja virtual' },
  { id: 'usuarios', name: 'Usuários', description: 'Gestão de usuários (apenas admin)' }
];

const ACTIONS: { id: Action; name: string; description: string; color: string }[] = [
  { id: 'view', name: 'Visualizar', description: 'Ver dados', color: 'bg-blue-500' },
  { id: 'create', name: 'Criar', description: 'Adicionar novos registros', color: 'bg-green-500' },
  { id: 'edit', name: 'Editar', description: 'Modificar registros', color: 'bg-yellow-500' },
  { id: 'delete', name: 'Excluir', description: 'Remover registros', color: 'bg-red-500' },
  { id: 'export', name: 'Exportar', description: 'Exportar dados', color: 'bg-purple-500' }
];

const Permissoes = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    gerente: {},
    vendedor: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>('gerente');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const data = await permissoesAPI.getAll();
      
      const permissionsState: PermissionsState = {
        gerente: {},
        vendedor: {}
      };

      data.forEach((perm: any) => {
        if (perm.role === 'gerente' || perm.role === 'vendedor') {
          permissionsState[perm.role][perm.module] = perm.actions;
        }
      });

      setPermissions(permissionsState);
    } catch (error) {
      toast.error("Erro ao carregar permissões", {
        description: "Verifique sua conexão e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAction = (role: Role, module: string, action: Action) => {
    setPermissions(prev => {
      const moduleActions = prev[role][module] || [];
      const hasAction = moduleActions.includes(action);
      
      const newActions = hasAction
        ? moduleActions.filter(a => a !== action)
        : [...moduleActions, action];

      return {
        ...prev,
        [role]: {
          ...prev[role],
          [module]: newActions
        }
      };
    });
  };

  const toggleAllActions = (role: Role, module: string, enable: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: enable ? ACTIONS.map(a => a.id) : []
      }
    }));
  };

  const savePermissions = async () => {
    try {
      setIsSaving(true);
      
      const permissionsToSave = [];
      
      for (const role of ['gerente', 'vendedor'] as Role[]) {
        for (const module of MODULES) {
          // Usuários só para admin, não salvar para outras roles
          if (module.id === 'usuarios') continue;
          
          permissionsToSave.push({
            role,
            module: module.id,
            actions: permissions[role][module.id] || []
          });
        }
      }

      await permissoesAPI.batchUpdate(permissionsToSave);
      
      toast.success("✅ Permissões salvas com sucesso!", {
        description: "As alterações foram aplicadas ao sistema",
      });
    } catch (error) {
      toast.error("❌ Erro ao salvar permissões", {
        description: "Verifique sua conexão e tente novamente",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initializeDefaults = async (role: Role) => {
    try {
      setIsSaving(true);
      await permissoesAPI.initializeDefaults(role);
      toast.success(`Permissões padrão aplicadas para ${role}!`);
      loadPermissions();
    } catch (error) {
      toast.error("Erro ao inicializar permissões padrão");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleStats = (role: Role) => {
    let totalModules = 0;
    let activeModules = 0;
    let totalActions = 0;

    MODULES.forEach(module => {
      if (module.id === 'usuarios') return; // Excluir usuários
      totalModules++;
      const moduleActions = permissions[role][module.id] || [];
      if (moduleActions.length > 0) activeModules++;
      totalActions += moduleActions.length;
    });

    return { totalModules, activeModules, totalActions };
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Gerenciar Permissões</h1>
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = getRoleStats(activeRole);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            Gerenciar Permissões
          </h1>
          <p className="text-muted-foreground">
            Configure o acesso de gerentes e vendedores aos módulos do sistema
          </p>
          
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="secondary" className="text-sm">
              <Info className="h-3 w-3 mr-1" />
              {stats.activeModules} de {stats.totalModules} módulos ativos
            </Badge>
            <Badge variant="outline" className="text-sm">
              {stats.totalActions} ações habilitadas
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadPermissions}
            disabled={isSaving}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button
            onClick={savePermissions}
            disabled={isSaving}
            className="gap-2 bg-gradient-to-r from-primary to-accent"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as Role)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="gerente" className="gap-2">
            <Shield className="h-4 w-4" />
            Gerente
          </TabsTrigger>
          <TabsTrigger value="vendedor" className="gap-2">
            <Shield className="h-4 w-4" />
            Vendedor
          </TabsTrigger>
        </TabsList>

        {(['gerente', 'vendedor'] as Role[]).map(role => (
          <TabsContent key={role} value={role} className="space-y-4 mt-6">
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Permissões do {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initializeDefaults(role)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Aplicar Padrões
                  </Button>
                </CardTitle>
                <CardDescription>
                  Configure quais ações o {role} pode realizar em cada módulo
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-4">
              {MODULES.map(module => {
                // Usuários é exclusivo de admin
                if (module.id === 'usuarios') {
                  return (
                    <Card key={module.id} className="opacity-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {module.name}
                          <Badge variant="secondary" className="text-xs">Apenas Admin</Badge>
                        </CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  );
                }

                const moduleActions = permissions[role][module.id] || [];
                const allEnabled = ACTIONS.every(a => moduleActions.includes(a.id));
                const someEnabled = moduleActions.length > 0 && !allEnabled;

                return (
                  <Card key={module.id} className="transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {module.name}
                            {moduleActions.length > 0 && (
                              <Badge variant="default" className="text-xs">
                                {moduleActions.length} {moduleActions.length === 1 ? 'ação' : 'ações'}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Todas</span>
                          <Switch
                            checked={allEnabled}
                            onCheckedChange={(checked) => toggleAllActions(role, module.id, checked)}
                            className={someEnabled ? 'opacity-50' : ''}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {ACTIONS.map(action => {
                          const isEnabled = moduleActions.includes(action.id);
                          return (
                            <button
                              key={action.id}
                              onClick={() => toggleAction(role, module.id, action.id)}
                              className={`
                                p-3 rounded-lg border-2 transition-all text-left
                                ${isEnabled
                                  ? 'border-primary bg-primary/10 shadow-sm'
                                  : 'border-border hover:border-primary/50'
                                }
                              `}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${isEnabled ? action.color : 'bg-muted'}`} />
                                <span className="font-medium text-sm">{action.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                              {isEnabled && (
                                <CheckCircle2 className="h-3 w-3 text-primary mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Administradores têm acesso total a todos os módulos e ações automaticamente</p>
          <p>• O módulo "Usuários" é exclusivo para administradores e não pode ser configurado para outras roles</p>
          <p>• As alterações só entram em vigor após clicar em "Salvar Alterações"</p>
          <p>• Usuários precisam fazer login novamente para que as novas permissões sejam aplicadas</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Permissoes;
