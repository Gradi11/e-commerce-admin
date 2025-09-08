const axios = require('axios');
const FormData = require('form-data');

// ImgBB API configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '7f66163dd34d5d993b255bb885a38eb0'; // Your ImgBB API key
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Function to detect MIME type from buffer
const detectMimeType = (buffer) => {
    const signatures = {
        '/9j/': 'image/jpeg',
        'iVBORw0KGgo': 'image/png',
        'R0lGODlh': 'image/gif',
        'UklGRg==': 'image/webp'
    };
    
    const base64 = buffer.toString('base64');
    for (const [signature, mimeType] of Object.entries(signatures)) {
        if (base64.startsWith(signature)) {
            return mimeType;
        }
    }
    return 'image/jpeg'; // Default fallback
};

// Function to upload image to ImgBB
const uploadToImgBB = async (imageBuffer, originalName) => {
    try {
        // Validate input parameters
        if (!imageBuffer) {
            throw new Error('Image buffer is required');
        }
        
        if (!Buffer.isBuffer(imageBuffer)) {
            throw new Error('Image buffer must be a Buffer');
        }
        
        if (imageBuffer.length === 0) {
            throw new Error('Empty image buffer provided');
        }
        
        if (imageBuffer.length > 32 * 1024 * 1024) { // 32MB limit
            throw new Error('Image too large (max 32MB)');
        }
        
        if (!originalName || typeof originalName !== 'string') {
            throw new Error('Valid original filename is required');
        }
        
    
        
        // Create form data with file buffer
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        
        // Detect MIME type and append the buffer as a file
        const mimeType = detectMimeType(imageBuffer);
        formData.append('image', imageBuffer, {
            filename: originalName,
            contentType: mimeType
        });

        const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 30000 // 30 second timeout
        });



        if (response.data.success) {
            return {
                success: true,
                url: response.data.data.url
            };
        } else {
            throw new Error('ImgBB upload failed: ' + (response.data.error?.message || response.data.status_txt || 'Unknown error'));
        }
    } catch (error) {

        
        // Log more details for debugging
        if (error.response) {
            
        }
        
        return {
            success: false,
            error: error.message || 'Upload failed'
        };
    }
};

module.exports = {
    uploadToImgBB,
    IMGBB_API_KEY
}; 