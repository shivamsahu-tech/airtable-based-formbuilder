import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    airtableUserId: { type: String, required: true, unique: true },
    email: String,
    name: String,
    avatarUrl: String,
    accessToken: { type: String, required: true },
    lastLoginAt: { type: Date, default: Date.now },
    webhookId: String,
    webhooks: [{
      baseId: String,
      webhookId: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
