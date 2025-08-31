document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupFormHandling();
});

// Load categories from the server
async function loadCategories() {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        const response = await fetch('/api/admin/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            displayCategories(data.categories);
        } else {
            showAlert('Failed to load categories', 'error');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showAlert('Error loading categories', 'error');
    }
}

// Display categories in the grid
function displayCategories(categories) {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = categories.map(category => {
        // Get appropriate icon based on category name
        const iconClass = getCategoryIcon(category.name);
        
        // Display image if available, otherwise show icon
        const imageDisplay = category.image 
            ? `<img src="/uploads/categories/${category.image}" alt="${category.name}" class="w-16 h-16 object-cover rounded-lg">`
            : `<div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                 <i class="${iconClass} text-2xl text-blue-500"></i>
               </div>`;
        
        return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-200 hover:scale-105">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    ${imageDisplay}
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${category.name}</h3>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editCategory('${category._id}')" 
                        class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                        <i class="ri-edit-line text-lg"></i>
                    </button>
                    <button onclick="deleteCategory('${category._id}')"
                        class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                        <i class="ri-delete-bin-line text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Helper function to get category icon
function getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    
    // Add more mappings as needed
    const iconMap = {
        electronics: 'ri-computer-line',
        clothing: 'ri-t-shirt-line',
        books: 'ri-book-line',
        furniture: 'ri-home-line',
        food: 'ri-restaurant-line',
        sports: 'ri-basketball-line',
        toys: 'ri-gamepad-line',
        beauty: 'ri-brush-line',
        health: 'ri-heart-line',
        automotive: 'ri-car-line',
        jewelry: 'ri-diamond-line',
        garden: 'ri-plant-line',
        pets: 'ri-footprint-line',
        art: 'ri-palette-line',
        music: 'ri-music-line',
        travel: 'ri-plane-line',
        office: 'ri-briefcase-line',
        baby: 'ri-baby-line',
        digital: 'ri-smartphone-line',
        others: 'ri-price-tag-3-line'
    };

    // Find matching icon or return default
    for (const [key, icon] of Object.entries(iconMap)) {
        if (name.includes(key)) {
            return icon;
        }
    }
    
    return 'ri-price-tag-3-line'; // Default icon
}

// Handle image upload and preview
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please select a valid image file (PNG, JPG, GIF, WEBP)', 'error');
        event.target.value = '';
        return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').classList.remove('hidden');
        document.getElementById('fileInputContainer').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// Remove image preview
function removeImage() {
    document.getElementById('categoryImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('fileInputContainer').classList.remove('hidden');
    document.getElementById('previewImg').src = '';
}

// Modal handling
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('fileInputContainer').classList.remove('hidden');
    document.getElementById('categoryModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('categoryModal').classList.add('hidden');
    // Reset image preview
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('fileInputContainer').classList.remove('hidden');
    document.getElementById('previewImg').src = '';
}

// Form handling
function setupFormHandling() {
    const form = document.getElementById('categoryForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categoryId = form.dataset.categoryId;
        
        // Get the name value first
        const name = document.getElementById('categoryName').value;
        if (!name || name.trim() === '') {
            showAlert('Category name is required', 'error');
            return;
        }

        // Create FormData manually to ensure proper structure
        const formData = new FormData();
        formData.append('name', name.trim());
        
        // Add image file if selected
        const imageFile = document.getElementById('categoryImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(
                categoryId 
                    ? `/api/admin/categories/${categoryId}`
                    : '/api/admin/categories', 
                {
                    method: categoryId ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (data.success) {
                showAlert(
                    categoryId 
                        ? 'Category updated successfully'
                        : 'Category added successfully', 
                    'success'
                );
                closeModal();
                loadCategories();
            } else {
                showAlert(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Operation failed', 'error');
        }
    });
}

// Edit category function
async function editCategory(id) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/categories/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch category');
        }

        const data = await response.json();

        if (data.success && data.category) {
            // Reset form and clear previous ID
            const form = document.getElementById('categoryForm');
            form.reset();
            delete form.dataset.categoryId;

            // Set modal title and form values
            document.getElementById('modalTitle').textContent = 'Edit Category';
            document.getElementById('categoryName').value = data.category.name;
            
            // Handle image preview for editing
            if (data.category.image) {
                document.getElementById('previewImg').src = `/uploads/categories/${data.category.image}`;
                document.getElementById('imagePreview').classList.remove('hidden');
                document.getElementById('fileInputContainer').classList.add('hidden');
            } else {
                document.getElementById('imagePreview').classList.add('hidden');
                document.getElementById('fileInputContainer').classList.remove('hidden');
            }
            
            // Add category ID to form for update
            form.dataset.categoryId = id;
            
            // Show modal
            openAddModal();
        } else {
            throw new Error(data.message || 'Failed to load category details');
        }
    } catch (error) {
        console.error('Error loading category:', error);
        showAlert(error.message || 'Error loading category details', 'error');
    }
}

// Delete category function
async function deleteCategory(id) {
    // Create and show confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                    <i class="ri-delete-bin-line text-2xl text-red-600 dark:text-red-400"></i>
                </div>
                <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Delete Category</h3>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this category? This action cannot be undone.
                </p>
                <div class="mt-6 flex justify-center space-x-3">
                    <button type="button" class="cancel-delete px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition duration-200">
                        Cancel
                    </button>
                    <button type="button" class="confirm-delete px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-200">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Handle dialog buttons
    dialog.querySelector('.cancel-delete').onclick = () => dialog.remove();
    dialog.querySelector('.confirm-delete').onclick = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            dialog.remove();

            if (data.success) {
                showAlert('Category deleted successfully', 'success');
                loadCategories();
            } else {
                showAlert(data.message || 'Failed to delete category', 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showAlert('Error deleting category', 'error');
            dialog.remove();
        }
    };
}

// Enhanced alert function with better UI
function showAlert(message, type) {
    const alert = document.createElement('div');
    
    alert.className = `fixed top-4 right-4 z-50 p-4 pr-12 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    alert.style.minWidth = '300px';
    
    const bgColor = type === 'success' 
        ? 'bg-green-50 dark:bg-green-900 border-l-4 border-green-500' 
        : 'bg-red-50 dark:bg-red-900 border-l-4 border-red-500';
    
    const textColor = type === 'success'
        ? 'text-green-800 dark:text-green-200'
        : 'text-red-800 dark:text-red-200';
    
    alert.className += ` ${bgColor} ${textColor}`;

    const icon = type === 'success' 
        ? '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';

    alert.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                ${icon}
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium">
                    ${type === 'success' ? 'Success!' : 'Error!'}
                </h3>
                <p class="mt-1 text-sm">
                    ${message}
                </p>
            </div>
            <button class="ml-4 flex-shrink-0 text-sm font-medium focus:outline-none">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(alert);

    // Add entrance animation
    requestAnimationFrame(() => {
        alert.style.transform = 'translateX(0)';
    });

    // Add click handler to close button
    alert.querySelector('button').onclick = () => {
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => alert.remove(), 300);
    };

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
} 