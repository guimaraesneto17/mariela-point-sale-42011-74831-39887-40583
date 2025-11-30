import mongoose, { Schema, Document } from 'mongoose';

export type ModuleName = 
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

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export';

export interface IPermission extends Document {
  role: 'admin' | 'gerente' | 'vendedor';
  module: ModuleName;
  actions: Action[];
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema: Schema = new Schema({
  role: {
    type: String,
    enum: ['admin', 'gerente', 'vendedor'],
    required: true
  },
  module: {
    type: String,
    enum: [
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
    ],
    required: true
  },
  actions: [{
    type: String,
    enum: ['view', 'create', 'edit', 'delete', 'export']
  }]
}, {
  timestamps: true
});

// Índice único para evitar duplicação
PermissionSchema.index({ role: 1, module: 1 }, { unique: true });

const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);

export default Permission;
