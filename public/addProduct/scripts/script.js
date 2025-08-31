document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    const form = document.getElementById('addProductForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Product...
            `;

            const formData = new FormData();
            
            // Add basic fields
            formData.append('name', document.getElementById('name').value.trim());
            
            // Add selected categories
            const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
                .map(cb => cb.value);
            formData.append('category', JSON.stringify(selectedCategories));
            
            formData.append('description', document.getElementById('description').value.trim());
            formData.append('price', document.getElementById('price').value);
            formData.append('stock', document.getElementById('stock').value);

            // Add sale price if provided
            const salePrice = document.getElementById('salePrice').value;
            if (salePrice) {
                formData.append('salePrice', salePrice);
            }

            // Add images
            const imageFiles = document.getElementById('image').files;
            if (imageFiles.length > 0) {
                for (let i = 0; i < imageFiles.length; i++) {
                    formData.append('images', imageFiles[i]);
                }
            }

            // Add colors
            const selectedColors = Array.from(document.querySelectorAll('input[name="colors"]:checked'))
                .map(cb => cb.value);
            formData.append('colors', JSON.stringify(selectedColors));

            // Add sizes
            const selectedSizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked'))
                .map(cb => cb.value);
            formData.append('sizes', JSON.stringify(selectedSizes));

            // Get admin token
            const token = localStorage.getItem('adminToken');
            if (!token) {
                window.location.href = '../index.html';
                return;
            }

            // Send request
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text(); // Get the error response text
                throw new Error(`Failed to create product: ${errorText}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                showAlert('Product added successfully!', 'success');
                // Redirect to products page after short delay
                setTimeout(() => {
                    window.location.href = '../products/index.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to add product');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message || 'Error adding product', 'error');
        } finally {
            // Reset button state
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Add Product';
        }
    });
});

// Function to load categories
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
            const categoryCheckboxes = document.getElementById('category-checkboxes');
            
            // Clear existing content
            categoryCheckboxes.innerHTML = '';
            
            // Add categories as checkboxes
            data.categories.forEach(category => {
                const label = document.createElement('label');
                label.className = 'flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-transparent';
                label.innerHTML = `
                    <input type="checkbox" name="category" value="${category.name}" 
                           class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2">
                    <span class="ml-3 text-sm text-gray-700 dark:text-gray-300 font-medium">${category.name}</span>
                `;
                categoryCheckboxes.appendChild(label);
            });

            // Add event listeners to track selected categories
            const checkboxes = categoryCheckboxes.querySelectorAll('input[type="checkbox"]');
            const selectedCountSpan = document.getElementById('selected-categories-count');
            
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const selectedCount = categoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked').length;
                    selectedCountSpan.textContent = selectedCount;
                    
                    // Update visual feedback
                    const label = checkbox.closest('label');
                    if (checkbox.checked) {
                        label.classList.add('bg-primary/10', 'border-primary/20');
                    } else {
                        label.classList.remove('bg-primary/10', 'border-primary/20');
                    }
                });
            });

            // Initialize count
            selectedCountSpan.textContent = '0';
        } else {
            showAlert('Failed to load categories', 'error');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showAlert('Error loading categories', 'error');
    }
}

// Update your existing createProduct function to include category
async function createProduct(formData) {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert('Product created successfully', 'success');
            document.getElementById('productForm').reset();
        } else {
            showAlert(data.message || 'Failed to create product', 'error');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showAlert('Error creating product', 'error');
    }
}

// Alert function (same as in products page)
function showAlert(message, type) {
    const alert = document.createElement('div');
    
    alert.className = `fixed top-4 right-4 z-50 p-4 pr-12 rounded-lg shadow-lg transform transition-all 
        ${type === 'success' 
            ? 'bg-green-50 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200'
        }`;

    // Create icon based on type
    const icon = document.createElement('span');
    icon.className = 'absolute left-4 top-4';
    icon.innerHTML = type === 'success' 
        ? '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'ml-8';
    
    // Add title based on type
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium';
    title.textContent = type === 'success' ? 'Success!' : 'Error!';
    
    // Add message
    const text = document.createElement('p');
    text.className = 'mt-1 text-sm';
    text.textContent = message;
    
    messageContainer.appendChild(title);
    messageContainer.appendChild(text);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = `absolute top-4 right-4 text-${type === 'success' ? 'green' : 'red'}-500 dark:text-${type === 'success' ? 'green' : 'red'}-200 hover:opacity-75`;
    closeButton.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
    
    closeButton.onclick = () => alert.remove();

    alert.appendChild(icon);
    alert.appendChild(messageContainer);
    alert.appendChild(closeButton);
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.transform = 'translateX(100%)';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
} 