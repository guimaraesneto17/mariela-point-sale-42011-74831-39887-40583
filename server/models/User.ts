import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'gerente' | 'vendedor';

export interface IUser extends Document {
  email: string;
  password: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
  codigoVendedor?: string | null; // Referência ao vendedor se role = 'vendedor'
  dataCriacao: Date;
  ultimoAcesso?: Date;
  loginAttempts: number;
  lockUntil?: Date | null;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
  },
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [3, 'Nome deve ter no mínimo 3 caracteres'],
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  role: {
    type: String,
    enum: ['admin', 'gerente', 'vendedor'],
    default: 'vendedor',
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  codigoVendedor: {
    type: String,
    default: null,
    match: [/^V\d{3}$/, 'Código de vendedor inválido']
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimoAcesso: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ ativo: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
