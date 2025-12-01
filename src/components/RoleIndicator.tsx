import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    color: "bg-red-500 text-white hover:bg-red-600",
    description: "Acesso total ao sistema"
  },
  gerente: {
    label: "Gerente",
    icon: Shield,
    color: "bg-blue-500 text-white hover:bg-blue-600",
    description: "Acesso gerencial configurável"
  },
  vendedor: {
    label: "Vendedor",
    icon: ShieldAlert,
    color: "bg-green-500 text-white hover:bg-green-600",
    description: "Acesso limitado configurável"
  }
};

export function RoleIndicator() {
  const { user, permissions } = useAuth();

  if (!user) return null;

  const config = roleConfig[user.role];
  const Icon = config.icon;

  // Contar módulos acessíveis
  const modulosAcessiveis = user.role === 'admin' 
    ? 'Todos os módulos' 
    : permissions?.length 
      ? `${permissions.length} ${permissions.length === 1 ? 'módulo' : 'módulos'}`
      : 'Nenhum módulo';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.color} cursor-help flex items-center gap-1.5 px-3 py-1`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-sm">{user.nome}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">{config.description}</p>
              <p className="text-xs text-muted-foreground">
                {modulosAcessiveis}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
