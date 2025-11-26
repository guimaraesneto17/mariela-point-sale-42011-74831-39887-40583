import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Users, Calendar } from "lucide-react";
import { differenceInDays } from "date-fns";

interface InadimplenciaReportProps {
  contasPagar: any[];
  contasReceber: any[];
}

export function InadimplenciaReport({ contasPagar, contasReceber }: InadimplenciaReportProps) {
  
  const calcularInadimplentes = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const contasVencidas: any[] = [];
    
    // Processar contas a pagar
    contasPagar.forEach((conta: any) => {
      if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
        conta.parcelas?.forEach((parcela: any) => {
          if (parcela.status === 'Vencido') {
            const dataVenc = new Date(parcela.dataVencimento);
            dataVenc.setHours(0, 0, 0, 0);
            const diasAtraso = differenceInDays(hoje, dataVenc);
            contasVencidas.push({
              tipo: 'Pagar',
              numero: `${conta.numeroDocumento} (${parcela.numeroParcela}/${conta.parcelas.length})`,
              descricao: conta.descricao,
              entidade: conta.fornecedor?.nome || 'N/A',
              tipoEntidade: 'Fornecedor',
              valor: parcela.valor,
              dataVencimento: parcela.dataVencimento,
              diasAtraso
            });
          }
        });
      } else if (conta.status === 'Vencido') {
        const dataVenc = new Date(conta.dataVencimento);
        dataVenc.setHours(0, 0, 0, 0);
        const diasAtraso = differenceInDays(hoje, dataVenc);
        contasVencidas.push({
          tipo: 'Pagar',
          numero: conta.numeroDocumento,
          descricao: conta.descricao,
          entidade: conta.fornecedor?.nome || 'N/A',
          tipoEntidade: 'Fornecedor',
          valor: conta.valor,
          dataVencimento: conta.dataVencimento,
          diasAtraso
        });
      }
    });
    
    // Processar contas a receber
    contasReceber.forEach((conta: any) => {
      if (conta.tipoCriacao === 'Parcelamento' || conta.tipoCriacao === 'Replica') {
        conta.parcelas?.forEach((parcela: any) => {
          if (parcela.status === 'Vencido') {
            const dataVenc = new Date(parcela.dataVencimento);
            dataVenc.setHours(0, 0, 0, 0);
            const diasAtraso = differenceInDays(hoje, dataVenc);
            contasVencidas.push({
              tipo: 'Receber',
              numero: `${conta.numeroDocumento} (${parcela.numeroParcela}/${conta.parcelas.length})`,
              descricao: conta.descricao,
              entidade: conta.cliente?.nome || 'N/A',
              tipoEntidade: 'Cliente',
              valor: parcela.valor,
              dataVencimento: parcela.dataVencimento,
              diasAtraso
            });
          }
        });
      } else if (conta.status === 'Vencido') {
        const dataVenc = new Date(conta.dataVencimento);
        dataVenc.setHours(0, 0, 0, 0);
        const diasAtraso = differenceInDays(hoje, dataVenc);
        contasVencidas.push({
          tipo: 'Receber',
          numero: conta.numeroDocumento,
          descricao: conta.descricao,
          entidade: conta.cliente?.nome || 'N/A',
          tipoEntidade: 'Cliente',
          valor: conta.valor,
          dataVencimento: conta.dataVencimento,
          diasAtraso
        });
      }
    });
    
    return contasVencidas.sort((a, b) => b.diasAtraso - a.diasAtraso);
  };
  
  const calcularPorEntidade = () => {
    const contasVencidas = calcularInadimplentes();
    const porEntidade: { [key: string]: { nome: string, tipo: string, total: number, quantidade: number, diasAtrasoMedia: number } } = {};
    
    contasVencidas.forEach(conta => {
      const key = conta.entidade;
      if (!porEntidade[key]) {
        porEntidade[key] = {
          nome: conta.entidade,
          tipo: conta.tipoEntidade,
          total: 0,
          quantidade: 0,
          diasAtrasoMedia: 0
        };
      }
      porEntidade[key].total += conta.valor;
      porEntidade[key].quantidade += 1;
      porEntidade[key].diasAtrasoMedia += conta.diasAtraso;
    });
    
    // Calcular média de dias de atraso
    Object.keys(porEntidade).forEach(key => {
      porEntidade[key].diasAtrasoMedia = Math.round(porEntidade[key].diasAtrasoMedia / porEntidade[key].quantidade);
    });
    
    return Object.values(porEntidade).sort((a, b) => b.total - a.total);
  };
  
  const contasVencidas = calcularInadimplentes();
  const inadimplenciaPorEntidade = calcularPorEntidade();
  const totalInadimplencia = contasVencidas.reduce((sum, c) => sum + c.valor, 0);
  const totalContasVencidas = contasVencidas.length;
  const diasAtrasoMedio = contasVencidas.length > 0 
    ? Math.round(contasVencidas.reduce((sum, c) => sum + c.diasAtraso, 0) / contasVencidas.length) 
    : 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  const getSeveridadeBadge = (dias: number) => {
    if (dias <= 7) return <Badge variant="secondary">Recente</Badge>;
    if (dias <= 30) return <Badge className="bg-orange-500">Atenção</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Atraso</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalInadimplencia)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalContasVencidas} conta(s) vencida(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entidades Inadimplentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inadimplenciaPorEntidade.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clientes e fornecedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atraso Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diasAtrasoMedio} dias</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio de atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Inadimplentes por Entidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Maiores Inadimplentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inadimplenciaPorEntidade.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente/Fornecedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Atraso Médio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inadimplenciaPorEntidade.slice(0, 10).map((entidade, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{entidade.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entidade.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{entidade.quantidade}</TableCell>
                    <TableCell className="text-right">{entidade.diasAtrasoMedia} dias</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {formatCurrency(entidade.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">Nenhuma inadimplência encontrada!</p>
              <p className="text-sm">Todas as contas estão em dia.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Contas Vencidas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atrasos</CardTitle>
        </CardHeader>
        <CardContent>
          {contasVencidas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Atraso</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasVencidas.map((conta, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{conta.numero}</TableCell>
                    <TableCell>
                      <Badge variant={conta.tipo === 'Pagar' ? 'destructive' : 'default'}>
                        {conta.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{conta.descricao}</TableCell>
                    <TableCell>{conta.entidade}</TableCell>
                    <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSeveridadeBadge(conta.diasAtraso)}
                        <span className="text-sm">{conta.diasAtraso}d</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(conta.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma conta vencida</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
