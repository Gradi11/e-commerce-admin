const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    type: { 
        type: String, 
        required: true, 
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    value: { 
        type: Number, 
        required: true,
        min: 0
    },
    maxDiscount: { 
        type: Number,
        default: null
    },
    minOrderAmount: { 
        type: Number,
        default: 0
    },
    maxUsage: { 
        type: Number,
        default: null
    },
    usedCount: { 
        type: Number,
        default: 0
    },
    applicableProducts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }],
    applicableCategories: [{ 
        type: String 
    }],
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isFirstTimeOnly: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt field before saving
discountSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for checking if discount is valid
discountSchema.virtual('isValid').get(function() {
    const now = new Date();
    return this.isActive && 
           this.startDate <= now && 
           this.endDate >= now &&
           (!this.maxUsage || this.usedCount < this.maxUsage);
});

// Virtual for discount percentage display
discountSchema.virtual('displayValue').get(function() {
    if (this.type === 'percentage') {
        return `${this.value}%`;
    } else {
        return `$${this.value}`;
    }
});

module.exports = mongoose.model('Discount', discountSchema); 