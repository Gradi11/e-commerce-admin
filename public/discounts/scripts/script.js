let allDiscounts = [];
let currentEditId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchDiscount');
  const statusFilter = document.getElementById('statusFilter');

  // Load initial data
  await loadDiscountStats();
  await fetchDiscounts();

  // Add event listeners
  searchInput.addEventListener('input', filterDiscounts);
  statusFilter.addEventListener('change', filterDiscounts);

  // Set default dates for new discounts
  setDefaultDates();
});

// Load discount statistics
async function loadDiscountStats() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    const response = await fetch('/api/admin/discounts/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch discount stats');
    }

    const data = await response.json();
    
    if (data.success) {
      document.getElementById('total-discounts').textContent = data.data.total;
      document.getElementById('active-discounts').textContent = data.data.active;
      document.getElementById('expired-discounts').textContent = data.data.expired;
      document.getElementById('upcoming-discounts').textContent = data.data.upcoming;
    }
  } catch (error) {
    console.error('Error loading discount stats:', error);
    showAlert('Error loading discount statistics', 'error');
  }
}

// Fetch all discounts
async function fetchDiscounts() {
  try {
    showLoading(true);
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    const response = await fetch('/api/admin/discounts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch discounts');
    }

    const data = await response.json();
    
    if (data.success) {
      allDiscounts = data.data;
      filterDiscounts();
    } else {
      throw new Error(data.message || 'No discounts found');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Error fetching discounts', 'error');
    showEmptyState();
  } finally {
    showLoading(false);
  }
}

// Filter discounts
function filterDiscounts() {
  const searchTerm = document.getElementById('searchDiscount').value.toLowerCase();
  const statusValue = document.getElementById('statusFilter').value;

  const filteredDiscounts = allDiscounts.filter(discount => {
    // Skip invalid discount objects
    if (!discount || typeof discount !== 'object') {
      return false;
    }
    
    const searchMatch = (discount.code && discount.code.toLowerCase().includes(searchTerm)) ||
                       (discount.name && discount.name.toLowerCase().includes(searchTerm)) ||
                       (discount.description && discount.description.toLowerCase().includes(searchTerm));
    
    let statusMatch = true;
    if (statusValue === 'active') {
      statusMatch = discount.isActive && isDiscountValid(discount);
    } else if (statusValue === 'inactive') {
      statusMatch = !discount.isActive;
    } else if (statusValue === 'expired') {
      statusMatch = new Date(discount.endDate) < new Date();
    }

    return searchMatch && statusMatch;
  });

  displayDiscounts(filteredDiscounts);
}

// Display discounts
function displayDiscounts(discounts) {
  const list = document.getElementById('discounts-list');
  
  if (discounts.length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();
  
  // Create table header
  const tableHeader = `
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      <div class="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        <div class="col-span-3">Discount</div>
        <div class="col-span-2">Type</div>
        <div class="col-span-2">Value</div>
        <div class="col-span-2">Usage</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-1">Actions</div>
      </div>
    </div>
  `;
  
  const listItems = discounts.map(discount => {
    // Skip invalid discount objects
    if (!discount || typeof discount !== 'object') {
      return '';
    }
    
    const status = getDiscountStatus(discount);
    const statusClass = getStatusClass(status);
    
    return `
      <div class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div class="px-6 py-4">
          <div class="grid grid-cols-12 gap-4 items-center">
            <!-- Discount Info -->
            <div class="col-span-3">
              <div class="flex flex-col">
                <h3 class="font-semibold text-gray-900 dark:text-white">${discount.name || 'Unnamed Discount'}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">${discount.code || 'NO-CODE'}</p>
                ${discount.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${discount.description}</p>` : ''}
              </div>
            </div>
            
            <!-- Type -->
            <div class="col-span-2">
              <span class="text-sm text-gray-900 dark:text-white">${discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</span>
            </div>
            
            <!-- Value -->
            <div class="col-span-2">
              <span class="text-sm font-medium text-primary">${discount.type === 'percentage' ? `${discount.value || 0}%` : `$${discount.value || 0}`}</span>
              ${discount.maxDiscount ? `<br><span class="text-xs text-gray-500 dark:text-gray-400">Max: $${discount.maxDiscount}</span>` : ''}
            </div>
            
            <!-- Usage -->
            <div class="col-span-2">
              <div class="flex flex-col">
                <span class="text-sm text-gray-900 dark:text-white">${discount.usedCount || 0}${discount.maxUsage ? ` / ${discount.maxUsage}` : ''}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">${formatDate(discount.endDate || new Date())}</span>
              </div>
            </div>
            
            <!-- Status -->
            <div class="col-span-2">
              <span class="status-badge ${statusClass}">${status}</span>
            </div>
            
            <!-- Actions -->
            <div class="col-span-1">
              <div class="flex space-x-1">
                <button onclick="editDiscount('${discount._id}')" 
                        class="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title="Edit">
                  <i class="ri-edit-line text-sm"></i>
                </button>
                <button onclick="toggleDiscountStatus('${discount._id}')" 
                        class="p-1 ${discount.isActive ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300' : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'} transition-colors"
                        title="${discount.isActive ? 'Deactivate' : 'Activate'}">
                  <i class="ri-toggle-line text-sm"></i>
                </button>
                <button onclick="deleteDiscount('${discount._id}')" 
                        class="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Delete">
                  <i class="ri-delete-bin-line text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  list.innerHTML = tableHeader + listItems;
}

// Get discount status
function getDiscountStatus(discount) {
  const now = new Date();
  const endDate = new Date(discount.endDate || now);
  
  if (!discount.isActive) {
    return 'Inactive';
  }
  
  if (endDate < now) {
    return 'Expired';
  }
  
  if (discount.maxUsage && (discount.usedCount || 0) >= discount.maxUsage) {
    return 'Used Up';
  }
  
  return 'Active';
}

// Get status class
function getStatusClass(status) {
  switch (status) {
    case 'Active':
      return 'status-active';
    case 'Inactive':
      return 'status-inactive';
    case 'Expired':
    case 'Used Up':
      return 'status-expired';
    default:
      return 'status-inactive';
  }
}

// Check if discount is valid
function isDiscountValid(discount) {
  const now = new Date();
  const endDate = new Date(discount.endDate || now);
  
  return discount.isActive && 
         endDate >= now &&
         (!discount.maxUsage || (discount.usedCount || 0) < discount.maxUsage);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show loading state
function showLoading(show) {
  const loadingState = document.getElementById('loading-state');
  const list = document.getElementById('discounts-list');
  
  if (show) {
    loadingState.classList.remove('hidden');
    list.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
    list.classList.remove('hidden');
  }
}

// Show empty state
function showEmptyState() {
  const emptyState = document.getElementById('empty-state');
  const list = document.getElementById('discounts-list');
  
  emptyState.classList.remove('hidden');
  list.classList.add('hidden');
}

// Hide empty state
function hideEmptyState() {
  const emptyState = document.getElementById('empty-state');
  const list = document.getElementById('discounts-list');
  
  emptyState.classList.add('hidden');
  list.classList.remove('hidden');
}

// Set default dates for new discounts
function setDefaultDates() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const startDate = now.toISOString().slice(0, 16);
  const endDate = tomorrow.toISOString().slice(0, 16);
  
  document.getElementById('start-date').value = startDate;
  document.getElementById('end-date').value = endDate;
}

// Open create modal
function openCreateModal() {
  currentEditId = null;
  document.getElementById('modal-title').textContent = 'Create New Discount';
  document.getElementById('submit-btn').textContent = 'Create Discount';
  
  // Reset form
  document.getElementById('discount-form').reset();
  setDefaultDates();
  document.getElementById('is-active').checked = true;
  
  openModal();
}

// Open edit modal
async function editDiscount(id) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/discounts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch discount details');
    }

    const data = await response.json();
    const discount = data.data;

    currentEditId = id;
    document.getElementById('modal-title').textContent = 'Edit Discount';
    document.getElementById('submit-btn').textContent = 'Update Discount';

    // Populate form
    document.getElementById('discount-code').value = discount.code;
    document.getElementById('discount-name').value = discount.name;
    document.getElementById('discount-description').value = discount.description || '';
    document.getElementById('discount-type').value = discount.type;
    document.getElementById('discount-value').value = discount.value;
    document.getElementById('max-discount').value = discount.maxDiscount || '';
    document.getElementById('min-order-amount').value = discount.minOrderAmount || 0;
    document.getElementById('max-usage').value = discount.maxUsage || '';
    document.getElementById('first-time-only').checked = discount.isFirstTimeOnly;
    document.getElementById('is-active').checked = discount.isActive;
    
    // Set dates
    const startDate = new Date(discount.startDate).toISOString().slice(0, 16);
    const endDate = new Date(discount.endDate).toISOString().slice(0, 16);
    document.getElementById('start-date').value = startDate;
    document.getElementById('end-date').value = endDate;

    openModal();
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error loading discount details', 'error');
  }
}

// Open modal
function openModal() {
  const modal = document.getElementById('discount-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
  const modal = document.getElementById('discount-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  currentEditId = null;
}

// Handle form submission
document.getElementById('discount-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const formData = {
      code: document.getElementById('discount-code').value,
      name: document.getElementById('discount-name').value,
      description: document.getElementById('discount-description').value,
      type: document.getElementById('discount-type').value,
      value: parseFloat(document.getElementById('discount-value').value),
      maxDiscount: document.getElementById('max-discount').value ? parseFloat(document.getElementById('max-discount').value) : null,
      minOrderAmount: parseFloat(document.getElementById('min-order-amount').value) || 0,
      maxUsage: document.getElementById('max-usage').value ? parseInt(document.getElementById('max-usage').value) : null,
      isFirstTimeOnly: document.getElementById('first-time-only').checked,
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value,
      isActive: document.getElementById('is-active').checked
    };

    const token = localStorage.getItem('adminToken');
    const url = currentEditId 
      ? `/api/admin/discounts/${currentEditId}`
      : '/api/admin/discounts';
    
    const method = currentEditId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showAlert(
        currentEditId ? 'Discount updated successfully!' : 'Discount created successfully!', 
        'success'
      );
      closeModal();
      await fetchDiscounts();
      await loadDiscountStats();
    } else {
      throw new Error(data.message || 'Failed to save discount');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Error saving discount', 'error');
  }
});

// Toggle discount status
async function toggleDiscountStatus(id) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/discounts/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showAlert(data.message, 'success');
      await fetchDiscounts();
      await loadDiscountStats();
    } else {
      throw new Error(data.message || 'Failed to toggle discount status');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Error toggling discount status', 'error');
  }
}

// Delete discount
function deleteDiscount(id) {
  // Create confirmation modal
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50';
  
  const modal = document.createElement('div');
  modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 transform transition-all';
  modal.innerHTML = `
    <div class="text-center">
      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
        <svg class="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Delete Discount
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Are you sure you want to delete this discount? This action cannot be undone.
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
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        backdrop.remove();
        showAlert('Discount deleted successfully', 'success');
        await fetchDiscounts();
        await loadDiscountStats();
      } else {
        throw new Error(data.message || 'Failed to delete discount');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert(error.message || 'Error deleting discount', 'error');
    }
  };
}

// Show alert function
function showAlert(message, type) {
  const alert = document.createElement('div');
  
  alert.className = `fixed top-4 right-4 z-50 p-4 pr-12 rounded-lg shadow-lg transform transition-all 
    ${type === 'success' 
      ? 'bg-green-50 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-200' 
      : 'bg-red-50 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200'
    }`;

  const icon = document.createElement('span');
  icon.className = 'absolute left-4 top-4';
  icon.innerHTML = type === 'success' 
    ? '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
    : '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';

  const messageContainer = document.createElement('div');
  messageContainer.className = 'ml-8';
  
  const title = document.createElement('h3');
  title.className = 'text-sm font-medium';
  title.textContent = type === 'success' ? 'Success!' : 'Error!';
  
  const text = document.createElement('p');
  text.className = 'mt-1 text-sm';
  text.textContent = message;
  
  messageContainer.appendChild(title);
  messageContainer.appendChild(text);

  const closeButton = document.createElement('button');
  closeButton.className = `absolute top-4 right-4 text-${type === 'success' ? 'green' : 'red'}-500 dark:text-${type === 'success' ? 'green' : 'red'}-200 hover:opacity-75`;
  closeButton.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
  
  closeButton.onclick = () => {
    alert.remove();
  };

  alert.appendChild(icon);
  alert.appendChild(messageContainer);
  alert.appendChild(closeButton);

  document.body.appendChild(alert);

  requestAnimationFrame(() => {
    alert.style.transform = 'translateX(0)';
    alert.style.opacity = '1';
  });

  setTimeout(() => {
    alert.style.transform = 'translateX(100%)';
    alert.style.opacity = '0';
    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 5000);
} 