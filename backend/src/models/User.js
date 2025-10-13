// backend/src/models/User.js
// Defines what a User looks like in our database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Login credentials
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
  
  // Account type
  accountType: {
    type: String,
    enum: ['parent', 'child', 'teacher', 'student', 'admin'],
    required: true
  },
  
  // If this is a child account, link to parent
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { 
      return this.accountType === 'child'; 
    }
  },
  
  // Profile information
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
  
  // Subscription & payment info
  subscription: {
    status: {
      type: String,
      enum: ['free', 'active', 'cancelled', 'past_due'],
      default: 'free'
    },
    tier: {
      type: String,
      enum: ['free', 'premium', 'classroom', 'school'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { 
      type: Boolean, 
      default: false 
    }
  },
  
  // What features can this user access?
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
      default: 1 // Free tier = 1 child, Premium = 5 children, Classroom=20, School=unlimited
    },
	// NEW: School-specific features
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
  
  // Game progress tracking
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
    achievements: [String]
  },
  
  // Parental controls (for child accounts)
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
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// BEFORE saving a user, hash their password
UserSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if password is correct
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has access to a feature
UserSchema.methods.hasAccess = function(feature) {
  return this.entitlements[feature] === true;
};

// COPPA compliance: Children under 13 must be created by parent
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