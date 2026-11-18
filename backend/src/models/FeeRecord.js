import mongoose from "mongoose";

const InstallmentSchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
    },
    receiptNumber: {
      type: String,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const FeeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
      index: true,
    },
    enrollmentNumber: {
      type: String,
      index: true,
      default: "",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    feeStatus: {
      type: String,
      enum: ["paid", "partially_paid", "pending", "overdue"],
      default: "paid",
    },
    installments: [InstallmentSchema],
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

FeeRecordSchema.index({ dueAmount: 1, dueDate: 1 });

export default mongoose.models.FeeRecord || mongoose.model("FeeRecord", FeeRecordSchema);

