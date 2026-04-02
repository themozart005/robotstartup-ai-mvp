// backend/src/models/User.js
// Defines what a User looks like in our database
// v2 — Added orgId, role, and updated subscription for tiered licensing

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

  // ─── Login credentials ───────────────────────────────────────────────────
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't include password in queries by default (security)
  },

  // ─── Account type ────────────────────────────────────────────────────────
  accountType: {
    type: String,
    enum: ['parent', 'child', 'teacher', 'student', 'admin'],
    required: true
  },

  // ─── NEW: Organization link ───────────────────────────────────────────────
  // Links this user to their school/district license
  // null = individual user with no org (free or personal subscription)
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },

  // ─── NEW: Platform role ───────────────────────────────────────────────────
  // teacher      = default for new signups
  // school_admin = purchased or manages a School license
  // district_admin = purchased or manages a District license
  // student      = CTE student using the simulation
  role: {
    type: String,
    enum: ['student', 'teacher', 'school_admin', 'district_admin'],
    default: 'teacher'
  },

  // ─── If this is a child account, link to parent ───────────────────────────
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.accountType === 'child';
    }
  },

  // ─── Profile information ─────────────────────────────────────────────────
  profile: {
    displayName: {
      type: String,
      required: true
    },
    age: {
      type: Number
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    grade: {
      type: String
    }
  },

  // ─── Subscription & payment info ─────────────────────────────────────────
  // UPDATED: expanded to support institutional tiers
  subscription: {
    // Status of the subscription
    // 'inactive'  = no subscription, no trial
    // 'trialing'  = active 14-day free trial
    // 'active'    = paid and current
    // 'cancelled' = user cancelled (access until licenseExpiry)
    // 'expired'   = license or trial has expired
    // 'past_due'  = Stripe payment failed, retrying
    status: {
      type: String,
      enum: ['inactive', 'trialing', 'active', 'cancelled', 'expired', 'past_due', 'free'],
      default: 'inactive'
    },

    // Tier of the license
    // 'free'      = no paid plan
    // 'trial'     = trialing any tier
    // 'classroom' = $299/yr — 1 teacher, 35 students
    // 'school'    = $1,499/yr — 10 teachers, 300 students
    // 'district'  = $4,999/yr — unlimited
    // 'premium'   = legacy individual premium (kept for backward compatibility)
    tier: {
      type: String,
      enum: ['free', 'trial', 'premium', 'classroom', 'school', 'district'],
      default: 'free'
    },

    stripeCustomerId:     { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },

    // Kept from original for backward compatibility
    currentPeriodEnd:  { type: Date,    default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },

    // NEW: trial and license expiry dates
    trialExpiry:   { type: Date, default: null },
    licenseExpiry: { type: Date, default: null }
  },

  // ─── What features can this user access? ─────────────────────────────────
  entitlements: {
    advancedMode: {
      type: Boolean,
      default: false
    },
    legendaryAI: {
      type: Boolean,
      default: false
    },
    maxChildren: {
      type: Number,
      default: 1 // Free=1, Premium=5, Classroom=20, School/District=unlimited
    },
    classroomFeatures: {
      type: Boolean,
      default: false // Teacher dashboard, class management
    },
    teacherDashboard: {
      type: Boolean,
      default: false
    },
    bulkStudentImport: {
      type: Boolean,
      default: false
    }
  },

  // ─── Game progress tracking ───────────────────────────────────────────────
  gameProgress: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    bestScore: {
      type: Number,
      default: 0
    },
    conceptsMastered: [String],
    achievements:     [String]
  },

  // ─── Parental controls (for child accounts) ───────────────────────────────
  parentalControls: {
    allowMultiplayer: {
      type: Boolean,
      default: true
    },
    dailyTimeLimit: {
      type: Number,
      default: 60 // minutes
    },
    contentRestrictions: [String]
  },

  // ─── Timestamps ───────────────────────────────────────────────────────────
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true // Automatically adds/updates createdAt and updatedAt
});

// ─── BEFORE saving, hash password if it changed ───────────────────────────────
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Method: check if password is correct ────────────────────────────────────
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: check if user has access to a feature ───────────────────────────
UserSchema.methods.hasAccess = function(feature) {
  return this.entitlements[feature] === true;
};

// ─── Method: check if license/trial is currently valid ───────────────────────
UserSchema.methods.isLicenseActive = function() {
  const now = new Date();
  if (this.subscription.status === 'active' &&
      this.subscription.licenseExpiry &&
      this.subscription.licenseExpiry > now) {
    return true;
  }
  if (this.subscription.status === 'trialing' &&
      this.subscription.trialExpiry &&
      this.subscription.trialExpiry > now) {
    return true;
  }
  return false;
};

// ─── COPPA compliance: children under 13 must be created by a parent ─────────
UserSchema.pre('validate', function(next) {
  if (this.accountType === 'child' &&
      this.profile.age &&
      this.profile.age < 13 &&
      !this.parentId) {
    return next(new Error('Children under 13 must be created by a parent account'));
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);