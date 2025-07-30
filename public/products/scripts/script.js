let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchProduct');
  const categoryFilter = document.getElementById('categoryFilter');
  const productList = document.getElementById('product-list');

  // First load categories
  await loadCategories();

  // Then fetch products
  await fetchProducts();

  // Add event listeners after data is loaded
  searchInput.addEventListener('input', filterProducts);
  categoryFilter.addEventListener('change', filterProducts);
});

// Fetch products function
async function fetchProducts() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    const response = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get the error response text
      throw new Error(`Failed to fetch products: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.data) {
      allProducts = data.data;
      filterProducts();
    } else {
      throw new Error(data.message || 'No products found');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Error fetching products', 'error');
  }
}

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

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();

    if (data.success) {
      const categoryFilter = document.getElementById('categoryFilter');
      
      // Keep the first "All Categories" option
      categoryFilter.innerHTML = '<option value="all">All Categories</option>';
      
      // Add categories from server
      data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name.toLowerCase();
        option.textContent = category.name;
        categoryFilter.appendChild(option);
      });
    } else {
      throw new Error(data.message || 'Failed to load categories');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Error loading categories', 'error');
  }
}

// Filter products function
function filterProducts() {
  const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
  const categoryValue = document.getElementById('categoryFilter').value.toLowerCase();
  const statusValue = document.getElementById('statusFilter')?.value || 'all';

  const filteredProducts = allProducts.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(searchTerm);
    
    // Handle multiple categories
    const productCategories = Array.isArray(product.category) ? product.category : [product.category];
    const categoryMatch = categoryValue === 'all' || 
                        productCategories.some(cat => cat.toLowerCase() === categoryValue);
    
    const statusMatch = statusValue === 'all' || 
                      (statusValue === 'instock' && product.stock > 0) ||
                      (statusValue === 'outofstock' && product.stock === 0);

    return nameMatch && categoryMatch && statusMatch;
  });

  document.getElementById('total-products-count').textContent = filteredProducts.length;
  displayProducts(filteredProducts);
}

// Display products function
function displayProducts(products) {
  const productList = document.getElementById('product-list');

  productList.innerHTML = products.map(product => `
    <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
      <td class="py-4 px-4">
        ${product.images && product.images.length > 0 ? `<img src="/public/uploads/products/${product.images[0]}" alt="${product.name}" class="product-image">` : ''}
      </td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">${product.name}</td>
      <td class="py-4 px-4 description text-gray-900 dark:text-gray-300">${product.description}</td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">
        <span class="cursor-help" title="${Array.isArray(product.category) ? product.category.join(', ') : product.category}">
          ${Array.isArray(product.category) ? 
            `${product.category[0]}${product.category.length > 1 ? ' <span class="text-primary font-medium">+' + (product.category.length - 1) + ' more</span>' : ''}` : 
            product.category}
        </span>
      </td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">$${product.price}</td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">${product.salePrice ? `$${product.salePrice}` : 'N/A'}</td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">${product.colors.join(', ')}</td>
      <td class="py-4 px-4 text-gray-900 dark:text-gray-300">${product.sizes.join(', ')}</td>
      <td class="py-4 px-4 text-center">
        <button onclick="editProduct('${product._id}')" 
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline mr-2">
          Edit
        </button>
        <button onclick="deleteProduct('${product._id}')"
                class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Edit product function
async function editProduct(id) {
  const modal = document.getElementById('edit-product-modal');
  const form = document.getElementById('edit-product-form');
  
  try {
    // Fetch product details
    const token = localStorage.getItem('adminToken');
    
    // Fetch categories first
    const categoryResponse = await fetch('/api/admin/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!categoryResponse.ok) {
      throw new Error('Failed to fetch categories');
    }

    const categoryData = await categoryResponse.json();
    
    if (categoryData.success) {
      const categoryCheckboxes = document.getElementById('edit-category-checkboxes');
      categoryCheckboxes.innerHTML = ''; // Clear existing options
      
      // Add categories from server as checkboxes
      categoryData.categories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-transparent';
        label.innerHTML = `
          <input type="checkbox" name="edit-category" value="${category.name}" 
                 class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2">
          <span class="ml-3 text-sm text-gray-700 dark:text-gray-300 font-medium">${category.name}</span>
        `;
        categoryCheckboxes.appendChild(label);
      });

      // Add event listeners to track selected categories in edit modal
      const editCheckboxes = categoryCheckboxes.querySelectorAll('input[type="checkbox"]');
      const editSelectedCountSpan = document.getElementById('edit-selected-categories-count');
      
      editCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const selectedCount = categoryCheckboxes.querySelectorAll('input[type="checkbox"]:checked').length;
          editSelectedCountSpan.textContent = selectedCount;
          
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
      editSelectedCountSpan.textContent = '0';
    }

    // Then fetch product details
    const productResponse = await fetch(`/api/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!productResponse.ok) {
      throw new Error('Failed to fetch product details');
    }

    const data = await productResponse.json();
    const product = data.data || data;

    if (!product) {
      throw new Error('Product not found');
    }

    // Populate form fields
    document.getElementById('edit-name').value = product.name;
    
    // Set selected categories
    const productCategories = Array.isArray(product.category) ? product.category : [product.category];
    document.querySelectorAll('input[name="edit-category"]').forEach(checkbox => {
      checkbox.checked = productCategories.includes(checkbox.value);
      
      // Update visual feedback for checked categories
      const label = checkbox.closest('label');
      if (checkbox.checked) {
        label.classList.add('bg-primary/10', 'border-primary/20');
      }
    });
    
    // Update selected count
    const editSelectedCountSpan = document.getElementById('edit-selected-categories-count');
    const selectedCount = document.querySelectorAll('input[name="edit-category"]:checked').length;
    editSelectedCountSpan.textContent = selectedCount;
    
    document.getElementById('edit-description').value = product.description;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-salePrice').value = product.salePrice || '';
    document.getElementById('edit-stock').value = product.stock;

    // Set colors
    document.querySelectorAll('input[name="colors"]').forEach(checkbox => {
      checkbox.checked = product.colors?.includes(checkbox.value);
    });

    // Set sizes
    document.querySelectorAll('input[name="sizes"]').forEach(checkbox => {
      checkbox.checked = product.sizes?.includes(checkbox.value);
    });

    // Show modal
    openEditModal();

    // Handle form submission
    form.onsubmit = async (e) => {
      e.preventDefault();

      try {
        const formData = new FormData();
        
        // Get selected colors
        const selectedColors = Array.from(document.querySelectorAll('input[name="colors"]:checked'))
          .map(cb => cb.value);
        
        // Get selected sizes
        const selectedSizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked'))
          .map(cb => cb.value);
        
        // Get selected categories
        const selectedCategories = Array.from(document.querySelectorAll('input[name="edit-category"]:checked'))
          .map(cb => cb.value);
        
        // Add all form data
        formData.append('name', document.getElementById('edit-name').value);
        formData.append('category', JSON.stringify(selectedCategories));
        formData.append('description', document.getElementById('edit-description').value);
        formData.append('price', document.getElementById('edit-price').value);
        formData.append('salePrice', document.getElementById('edit-salePrice').value || '');
        formData.append('stock', document.getElementById('edit-stock').value);
        formData.append('colors', JSON.stringify(selectedColors));
        formData.append('sizes', JSON.stringify(selectedSizes));

        // Image handling
        const imageFiles = document.getElementById('edit-image').files;
        if (imageFiles.length > 0) {
          for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
          }
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';

        // Make API request
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
          showAlert('Product updated successfully!', 'success');
          closeEditModal();
          await fetchProducts();
        } else {
          throw new Error(result.message || 'Failed to update product');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error updating product', 'error');
      } finally {
        // Reset button state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
      }
    };
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error loading product details', 'error');
  }
}

// Close modal function
function closeEditModal() {
  const modal = document.getElementById('edit-product-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto'; // Re-enable body scroll
}

// Open modal function
function openEditModal() {
  const modal = document.getElementById('edit-product-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Disable body scroll
}

// Add event listeners
document.getElementById('close-product-modal').addEventListener('click', closeEditModal);

// Close modal when clicking outside
document.getElementById('edit-product-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeEditModal();
  }
});

// Delete product function
function deleteProduct(id) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 transform transition-all';
  modal.innerHTML = `
    <div class="text-center">
      <!-- Warning Icon -->
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
        <svg class="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Delete Product
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Are you sure you want to delete this product? This action cannot be undone.
      </p>
      
      <div class="flex justify-center space-x-4">
        <button id="cancel-delete" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors">
          Cancel
        </button>
        <button id="confirm-delete" class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors">
          Delete
        </button>
      </div>
    </div>
  `;

  // Add modal to page
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Handle cancel
  const cancelButton = modal.querySelector('#cancel-delete');
  cancelButton.onclick = () => {
    backdrop.remove();
  };

  // Handle click outside modal
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  };

  // Handle delete confirmation
  const deleteButton = modal.querySelector('#confirm-delete');
  deleteButton.onclick = async () => {
    try {
      deleteButton.disabled = true;
      deleteButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Deleting...
      `;

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        backdrop.remove();
        showAlert('Product deleted successfully', 'success');
        await fetchProducts(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert(error.message || 'Error deleting product', 'error');
    }
  };
}

// Add this at the top of your file
function showAlert(message, type) {
  const alert = document.createElement('div');
  
  // Add Tailwind classes for better UI
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
  
  // Add click handler to close button
  closeButton.onclick = () => {
    alert.remove();
  };

  // Add elements to alert
  alert.appendChild(icon);
  alert.appendChild(messageContainer);
  alert.appendChild(closeButton);

  // Add alert to document
  document.body.appendChild(alert);

  // Add entrance animation
  requestAnimationFrame(() => {
    alert.style.transform = 'translateX(0)';
    alert.style.opacity = '1';
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    alert.style.transform = 'translateX(100%)';
    alert.style.opacity = '0';
    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 5000);
} 