// backend/src/models/Organization.js
// LevelUp Ventures Platform — Organization License Model
// Sits above individual User accounts; one org per school/district purchase

const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    // ─── Identity ────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    // ─── License Tier ────────────────────────────────────────────────────────
    // classroom = 1 teacher, 35 students, 1 module
    // school    = 10 teachers, 300 students, all modules
    // district  = unlimited teachers/students, all modules + admin dashboard
    type: {
      type: String,
      enum: ['classroom', 'school', 'district'],
      required: true,
    },

    // ─── License Status ───────────────────────────────────────────────────────
    licenseStatus: {
      type: String,
      enum: ['trial', 'active', 'expired', 'cancelled'],
      default: 'trial',
    },
    trialStarted: {
      type: Date,
      default: null,
    },
    trialExpiry: {
      type: Date,
      default: null,
    },
    licenseExpiry: {
      type: Date,
      default: null,
    },

    // ─── Stripe ───────────────────────────────────────────────────────────────
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },

    // ─── Admin (the teacher/coordinator who purchased) ────────────────────────
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─── Seat Limits (null = unlimited) ───────────────────────────────────────
    allowedTeachers: {
      type: Number,
      default: 1, // overridden per tier in webhook
    },
    allowedStudents: {
      type: Number,
      default: 35, // overridden per tier in webhook
    },

    // ─── Module Access ────────────────────────────────────────────────────────
    // Expand this array as new modules ship (healthcare, clean energy, fintech)
    modules: {
      type: [String],
      default: ['robotstartup'],
    },

    // ─── Feature Flags ────────────────────────────────────────────────────────
    features: {
      adminDashboard:    { type: Boolean, default: false },
      dataReports:       { type: Boolean, default: false },
      pdSupport:         { type: Boolean, default: false },
      customBranding:    { type: Boolean, default: false },
    },

    // ─── Usage Tracking (for data moat & IES SBIR reporting) ─────────────────
    stats: {
      totalTeachers:  { type: Number, default: 0 },
      totalStudents:  { type: Number, default: 0 },
      totalSessions:  { type: Number, default: 0 },
      lastActiveAt:   { type: Date, default: null },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ─── Helper: Is the license currently valid? ──────────────────────────────────
OrganizationSchema.methods.isLicenseActive = function () {
  const now = new Date();

  if (this.licenseStatus === 'active' && this.licenseExpiry && this.licenseExpiry > now) {
    return true;
  }

  if (this.licenseStatus === 'trial' && this.trialExpiry && this.trialExpiry > now) {
    return true;
  }

  return false;
};

// ─── Helper: Tier-based feature/seat defaults ────────────────────────────────
OrganizationSchema.statics.tierDefaults = function (tier) {
  const defaults = {
    classroom: {
      allowedTeachers: 1,
      allowedStudents: 35,
      modules: ['robotstartup'],
      features: {
        adminDashboard: false,
        dataReports:    false,
        pdSupport:      false,
        customBranding: false,
      },
    },
    school: {
      allowedTeachers: 10,
      allowedStudents: 300,
      modules: ['robotstartup', 'healthcare', 'cleanenergy', 'fintech'],
      features: {
        adminDashboard: false,
        dataReports:    true,
        pdSupport:      false,
        customBranding: false,
      },
    },
    district: {
      allowedTeachers: null, // unlimited
      allowedStudents: null, // unlimited
      modules: ['robotstartup', 'healthcare', 'cleanenergy', 'fintech'],
      features: {
        adminDashboard: true,
        dataReports:    true,
        pdSupport:      true,
        customBranding: true,
      },
    },
  };

  return defaults[tier] || defaults.classroom;
};

module.exports = mongoose.model('Organization', OrganizationSchema);
