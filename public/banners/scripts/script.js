// Sample data structure for banners
let banners = [];
let editingBannerId = null;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
  fetchBanners();
  setupFormListeners();
  setupDragAndDrop();
});

// Fetch banners from the server
async function fetchBanners() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    const response = await fetch('/api/admin/banners', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      banners = data.data;
      updateStats();
      renderTableView();
    }
  } catch (error) {
    console.error('Error fetching banners:', error);
    showAlert('Error loading banners', 'error');
  }
}

// Update statistics
function updateStats() {
  document.getElementById('totalBanners').textContent = banners.length;
  const activeBanners = banners.filter(banner => banner.status === 'active').length;
  document.getElementById('activeBanners').textContent = activeBanners;
}

// Render table view
function renderTableView() {
  const tbody = document.getElementById('bannersTable');
  tbody.innerHTML = banners.map(banner => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="w-20 h-12">
          <img src="/uploads/banners/${banner.image}" alt="${banner.title}" 
               class="w-full h-full object-cover rounded">
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900 dark:text-white">${banner.title}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          ${new Date(banner.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${banner.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
          ${banner.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="editBanner('${banner._id}')" 
                class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">
          Edit
        </button>
        <button onclick="deleteBanner('${banner._id}')"
                class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Setup form listeners
function setupFormListeners() {
  const imageInput = document.getElementById('bannerImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewContainer = document.getElementById('imagePreviewContainer');
  
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('bannerForm').addEventListener('submit', handleFormSubmit);
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = new FormData();
    const titleInput = document.getElementById('bannerTitle');
    const imageInput = document.getElementById('bannerImage');
    const statusInput = document.getElementById('bannerStatus');
    
    if (!titleInput.value || (!editingBannerId && !imageInput.files[0])) {
      showAlert('Title and image are required', 'error');
      return;
    }
    
    formData.append('title', titleInput.value);
    formData.append('status', statusInput.value || 'active');
    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }

    const token = localStorage.getItem('adminToken');
    const url = editingBannerId 
      ? `/api/admin/banners/${editingBannerId}`
      : '/api/admin/banners';
    
    const response = await fetch(url, {
      method: editingBannerId ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      showAlert(editingBannerId ? 'Banner updated successfully' : 'Banner added successfully', 'success');
      closeModal();
      fetchBanners();
    } else {
      throw new Error(data.message || 'Error saving banner');
    }
  } catch (error) {
    console.error('Error saving banner:', error);
    showAlert(error.message || 'Error saving banner', 'error');
  }
}

// Modal functions
function openAddModal() {
  editingBannerId = null;
  document.getElementById('modalTitle').textContent = 'Add New Banner';
  document.getElementById('bannerForm').reset();
  document.getElementById('imagePreviewContainer').classList.add('hidden');
  document.getElementById('bannerModal').classList.remove('hidden');
}

function editBanner(bannerId) {
  const banner = banners.find(b => b._id === bannerId);
  if (banner) {
    editingBannerId = bannerId;
    document.getElementById('modalTitle').textContent = 'Edit Banner';
    document.getElementById('bannerTitle').value = banner.title;
    document.getElementById('bannerStatus').value = banner.status || 'active';
    document.getElementById('imagePreview').src = `/uploads/${banner.image}`;
    document.getElementById('imagePreviewContainer').classList.remove('hidden');
    document.getElementById('bannerImage').required = false;
    document.getElementById('bannerModal').classList.remove('hidden');
  }
}

function closeModal() {
  document.getElementById('bannerModal').classList.add('hidden');
  document.getElementById('bannerForm').reset();
  editingBannerId = null;
}

// Delete banner
async function deleteBanner(bannerId) {
  const banner = banners.find(b => b._id === bannerId);
  const warningDialog = document.createElement('div');
  warningDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  warningDialog.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
          <svg class="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Delete Banner</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this banner? "${banner?.title}"<br>
            This action cannot be undone.
          </p>
        </div>
        <div class="mt-5 flex justify-center gap-3">
          <button 
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            onclick="this.closest('.fixed').remove()">
            Cancel
          </button>
          <button 
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
            onclick="confirmDeleteBanner('${bannerId}', this)">
            Delete Banner
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(warningDialog);
}

// Confirm and execute banner deletion
async function confirmDeleteBanner(bannerId, buttonElement) {
  try {
    const token = localStorage.getItem('adminToken');
    // Disable button and show loading state
    buttonElement.disabled = true;
    buttonElement.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Deleting...
    `;

    const response = await fetch(`/api/admin/banners/${bannerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.success) {
      // Remove the warning dialog
      buttonElement.closest('.fixed').remove();
      showAlert('Banner deleted successfully', 'success');
      fetchBanners();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error deleting banner:', error);
    showAlert('Error deleting banner', 'error');
    // Remove the warning dialog
    buttonElement.closest('.fixed').remove();
  }
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

// Add this function to handle drag and drop
function setupDragAndDrop() {
  const dropZone = document.querySelector('.border-dashed');
  const imageInput = document.getElementById('bannerImage');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    dropZone.classList.add('border-pink-500');
  }

  function unhighlight(e) {
    dropZone.classList.remove('border-pink-500');
  }

  dropZone.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    imageInput.files = files;
    
    if (files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('imagePreviewContainer').classList.remove('hidden');
      };
      reader.readAsDataURL(files[0]);
    }
  }
} 