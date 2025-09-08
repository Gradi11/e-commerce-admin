const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: [String], required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    stock: { type: Number, required: true },
    images: { type: [String], default: [] }, // Just store URLs as strings
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
