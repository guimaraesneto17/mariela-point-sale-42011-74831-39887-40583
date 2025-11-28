import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const RefreshTokenSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB remove automaticamente após expirar
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 });

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
