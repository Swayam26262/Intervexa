import mongoose, { Schema, type Model } from "mongoose";

export type PaymentStatus = "created" | "paid" | "failed";

export interface PaymentShape {
  userId: mongoose.Types.ObjectId;
  provider: "razorpay" | "simulated";
  productId: string;
  amountPaise: number;
  currency: "INR";
  orderId: string;
  paymentId?: string;
  status: PaymentStatus;
  /** Set once the purchase has been applied to the user (idempotency guard). */
  fulfilledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<PaymentShape>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["razorpay", "simulated"], required: true },
    productId: { type: String, required: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    fulfilledAt: { type: Date },
  },
  { timestamps: true },
);

export const Payment: Model<PaymentShape> =
  (mongoose.models.Payment as Model<PaymentShape>) ?? mongoose.model<PaymentShape>("Payment", schema);
