let allUsers = [];

// Move fetchUsers to global scope
async function fetchUsers() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '../index.html';
      return;
    }

    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      allUsers = data.data;
      filterUsers();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Move filterUsers to global scope
function filterUsers() {
  const searchInput = document.getElementById('search');
  const statusFilter = document.getElementById('statusFilter');
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user._id.toLowerCase().includes(searchTerm) ||
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm);
    
    const matchesStatus = 
      statusValue === 'all' || 
      user.isLogged.toString() === statusValue;

    return matchesSearch && matchesStatus;
  });

  document.getElementById('total-users-count').textContent = filteredUsers.length;
  displayUsers(filteredUsers);
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  const statusFilter = document.getElementById('statusFilter');

  // Add event listeners
  searchInput.addEventListener('input', filterUsers);
  statusFilter.addEventListener('change', filterUsers);

  // Initial fetch
  fetchUsers();
});

function displayUsers(users) {
  const tableBody = document.getElementById('user-table-body');
  tableBody.innerHTML = users.map(user => `
    <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
      <td class="px-6 py-4 text-gray-900 dark:text-gray-300">
        <span 
          class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
          onclick="copyToClipboard('${user._id}')"
          title="Click to copy ID"
        >
          #${user._id}
        </span>
      </td>
      <td class="px-6 py-4 text-gray-900 dark:text-gray-300">${user.name}</td>
      <td class="px-6 py-4 text-gray-900 dark:text-gray-300">${user.email}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-sm ${
          user.isLogged 
            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
        }">
          ${user.isLogged ? 'Online' : 'Offline'}
        </span>
      </td>
      <td class="px-6 py-4">
        <button onclick="openEditModal('${user._id}', '${user.name}', '${user.email}', '', ${user.isLogged})" 
                class="text-blue-600 dark:text-blue-400 hover:underline mr-2">
          Edit
        </button>
        <button onclick="deleteUser('${user._id}')"
                class="text-red-600 dark:text-red-400 hover:underline">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Edit user function
async function openEditModal(id, name, email, password, isLogged) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-user-form');
    
    // Set form values
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('password').value = ''; // Clear password field
    document.getElementById('isLogged').value = isLogged.toString();
    
    // Show modal
    modal.classList.remove('hidden');

    // Handle form submission
    form.onsubmit = async (e) => {
        e.preventDefault();

        try {
            const updatedUser = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                isLogged: document.getElementById('isLogged').value
            };

            // Client-side validation
            if (!updatedUser.name || !updatedUser.email) {
                showAlert('Name and email are required', 'error');
                return;
            }

            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedUser)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                closeEditModal();
                await fetchUsers(); // Refresh the user list
                showAlert(data.message, 'success');
            } else {
                showAlert(data.message || 'Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error updating user', 'error');
        }
    };
}

// Close modal function
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
}

// Show alert function
let currentAlert = null;

function showAlert(message, type) {
    // Remove existing alert if any
    if (currentAlert) {
        currentAlert.remove();
    }

    const alert = document.createElement('div');
    
    // Base styles
    alert.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl 
                      transform transition-all duration-300 flex items-center space-x-3
                      ${type === 'success' 
                          ? 'bg-green-50 text-green-800 border-l-4 border-green-500 dark:bg-green-900/50 dark:text-green-300' 
                          : 'bg-red-50 text-red-800 border-l-4 border-red-500 dark:bg-red-900/50 dark:text-red-300'
                      }`;

    // Add icon and message
    alert.innerHTML = `
        <div class="flex-shrink-0">
            ${type === 'success' 
                ? '<i class="ri-checkbox-circle-fill text-2xl text-green-500 dark:text-green-400"></i>'
                : '<i class="ri-error-warning-fill text-2xl text-red-500 dark:text-red-400"></i>'
            }
        </div>
        <div class="flex-1 text-sm font-medium">
            ${message}
        </div>
        <button class="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
            <i class="ri-close-line text-xl"></i>
        </button>
    `;

    // Add slide-in animation
    alert.style.transform = 'translateX(100%)';
    document.body.appendChild(alert);
    
    // Trigger animation
    setTimeout(() => {
        alert.style.transform = 'translateX(0)';
    }, 10);

    // Add close button functionality
    const closeButton = alert.querySelector('button');
    closeButton.addEventListener('click', () => {
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => alert.remove(), 300);
        if (currentAlert === alert) {
            currentAlert = null;
        }
    });

    currentAlert = alert;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alert && document.body.contains(alert)) {
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => {
                alert.remove();
                if (currentAlert === alert) {
                    currentAlert = null;
                }
            }, 300);
        }
    }, 5000);
}

// Add event listeners for modal close buttons
document.getElementById('close-modal').addEventListener('click', closeEditModal);

// Delete confirmation dialog
function showDeleteConfirmation(id) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0">
            <div class="text-center">
                <!-- Warning Icon -->
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                    <i class="ri-error-warning-fill text-2xl text-red-600 dark:text-red-400"></i>
                </div>
                
                <!-- Title -->
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Delete Customer
                </h3>
                
                <!-- Message -->
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Are you sure you want to delete this customer? This action cannot be undone.
                </p>
                
                <!-- Buttons -->
                <div class="flex justify-center space-x-3">
                    <button 
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                               dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                        onclick="this.closest('.fixed').remove()"
                    >
                        Cancel
                    </button>
                    <button 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                               focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        onclick="confirmDelete('${id}', this)"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
    
    // Trigger animation
    setTimeout(() => {
        dialog.querySelector('div > div').classList.remove('scale-95', 'opacity-0');
        dialog.querySelector('div > div').classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Handle delete confirmation
async function confirmDelete(id, button) {
    try {
        button.disabled = true;
        button.innerHTML = `
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            button.closest('.fixed').remove();
            showAlert('User deleted successfully!', 'success');
            await fetchUsers();
        } else {
            showAlert(data.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error deleting user', 'error');
    }
}

// Update the deleteUser function to use the new confirmation dialog
function deleteUser(id) {
    showDeleteConfirmation(id);
}

// Add copyToClipboard function
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show feedback tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-gray-800 text-white px-2 py-1 rounded text-sm z-50';
    tooltip.style.top = `${event.pageY - 30}px`;
    tooltip.style.left = `${event.pageX}px`;
    tooltip.textContent = 'Copied!';
    document.body.appendChild(tooltip);
    
    setTimeout(() => tooltip.remove(), 1000);
  });
}
