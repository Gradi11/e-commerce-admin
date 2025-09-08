// Define showOrderDetails globally
function showOrderDetails(order) {
  const modal = document.getElementById('orderModal');
  const orderDetails = document.getElementById('orderDetails');
  
  const totalAmount = order.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  
  orderDetails.innerHTML = `
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <h3 class="font-semibold text-sm mb-2">Order Information</h3>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Order ID:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${order._id}')"
            title="Click to copy"
          >
            #${order._id.substring(0, 6)}...
          </span>
        </p>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Date:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${new Date(order.createdAt).toLocaleString()}')"
            title="Click to copy"
          >
            ${new Date(order.createdAt).toLocaleString()}
          </span>
        </p>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Payment Reference:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${order.payment_reference_code || 'N/A'}')"
            title="Click to copy"
          >
            ${order.payment_reference_code || 'N/A'}
          </span>
        </p>
        <div class="text-xs mb-1.5 flex items-center gap-2">
          <span class="text-gray-500 dark:text-gray-400">Status:</span> 
          <select 
            id="orderStatusSelect" 
            class="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
            onchange="updateOrderStatus('${order._id}', this.value)"
            data-order-id="${order._id}"
          >
            <option value="payment_in_progress" ${order.order_status === 'payment_in_progress' ? 'selected' : ''}>Payment in Progress</option>
            <option value="order_accepted" ${order.order_status === 'order_accepted' ? 'selected' : ''}>Order Accepted</option>
            <option value="order_in_progress" ${order.order_status === 'order_in_progress' ? 'selected' : ''}>Order in Progress</option>
            <option value="order_completed" ${order.order_status === 'order_completed' ? 'selected' : ''}>Order Completed</option>
            <option value="order_cancelled" ${order.order_status === 'order_cancelled' ? 'selected' : ''}>Order Cancelled</option>
          </select>
          <span id="statusUpdateSpinner" class="hidden">
            <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-sm mb-2">Customer Information</h3>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Name:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${order.delivery_address[0]?.firstName} ${order.delivery_address[0]?.lastName}')"
            title="Click to copy"
          >
            ${order.delivery_address[0]?.firstName} ${order.delivery_address[0]?.lastName}
          </span>
        </p>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Phone:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${order.delivery_address[0]?.phoneNumber || 'N/A'}')"
            title="Click to copy"
          >
            ${order.delivery_address[0]?.phoneNumber || 'N/A'}
          </span>
        </p>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Address:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${order.delivery_address[0]?.address}, ${order.delivery_address[0]?.city}')"
            title="Click to copy"
          >
            ${order.delivery_address[0]?.address}, ${order.delivery_address[0]?.city}
          </span>
        </p>
        <p class="text-xs mb-1.5">
          <span class="text-gray-500 dark:text-gray-400">Delivery Option:</span> 
          <span 
            class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
            onclick="copyToClipboard('${order.delivery_option || 'N/A'}')"
            title="Click to copy"
          >
            ${order.delivery_option || 'N/A'}
          </span>
        </p>
      </div>
    </div>
    
    <div class="mt-4">
      <h3 class="font-semibold text-sm mb-2">Order Items</h3>
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        ${order.items.map(item => {
          // Get the title from either product_name or title
          const itemTitle = item.product_name || item.title;
          
          return `
            <div class="flex justify-between items-center py-1.5 border-b dark:border-gray-600 last:border-0">
              <div class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
                   onclick="copyToClipboard('${itemTitle} - Size: ${item.size || 'N/A'} - Color: ${item.color || 'N/A'} - Quantity: ${item.quantity} - Price: $${(item.price * item.quantity).toFixed(2)}')"
                   title="Click to copy item details">
                <p class="text-xs font-medium">${itemTitle}</p>
                <div class="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  <p>Size: ${item.size || 'N/A'}</p>
                  <p>Color: ${item.color || 'N/A'}</p>
                  <p>Quantity: ${item.quantity}</p>
                </div>
              </div>
              <p class="text-xs font-medium">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          `;
        }).join('')}
        <div class="flex justify-between items-center mt-3 pt-2 border-t dark:border-gray-600">
          <p class="text-xs font-semibold">Subtotal:</p>
          <p class="text-xs font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
             onclick="copyToClipboard('$${order.original_amount || totalAmount.toFixed(2)}')"
             title="Click to copy subtotal">
            $${order.original_amount || totalAmount.toFixed(2)}
          </p>
        </div>
        ${order.discount_coupon ? `
        <div class="flex justify-between items-center py-1.5 border-b dark:border-gray-600">
          <div class="flex items-center gap-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">Discount Coupon:</p>
            <span class="text-xs bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 px-2 py-0.5 rounded-full cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                 onclick="copyToClipboard('${order.discount_coupon}')"
                 title="Click to copy coupon code">
              ${order.discount_coupon}
            </span>
          </div>
          <p class="text-xs text-red-600 dark:text-red-400 font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
             onclick="copyToClipboard('-$${order.discount_amount || 0}')"
             title="Click to copy discount amount">
            -$${order.discount_amount || 0}
          </p>
        </div>
        ` : ''}
        <div class="flex justify-between items-center mt-3 pt-2 border-t dark:border-gray-600">
          <p class="text-xs font-semibold">Final Total:</p>
          <p class="text-xs font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
             onclick="copyToClipboard('$${order.final_amount || totalAmount.toFixed(2)}')"
             title="Click to copy final total">
            $${order.final_amount || totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
}

// Update the updateOrderStatus function
async function updateOrderStatus(orderId, newStatus) {
  const spinner = document.getElementById('statusUpdateSpinner');
  const statusSelect = document.getElementById('orderStatusSelect');
  const originalValue = statusSelect.value;
  
  try {
    spinner.classList.remove('hidden');
    statusSelect.disabled = true;
    
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();

    if (data.success) {
      // Show success feedback
      const tooltip = document.createElement('div');
      tooltip.className = 'fixed bg-green-600 text-white px-2 py-1 rounded text-xs z-50';
      tooltip.style.top = `${event.pageY - 30}px`;
      tooltip.style.left = `${event.pageX}px`;
      tooltip.textContent = 'Status updated successfully!';
      document.body.appendChild(tooltip);
      
      setTimeout(() => tooltip.remove(), 2000);

      // Get status styling
      const statusClass = 
        newStatus === 'order_completed' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
        newStatus === 'order_cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
        newStatus === 'order_accepted' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
        newStatus === 'order_in_progress' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' :
        'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';

      const dotClass = 
        newStatus === 'order_completed' ? 'bg-green-600 dark:bg-green-400' :
        newStatus === 'order_cancelled' ? 'bg-red-600 dark:bg-red-400' :
        newStatus === 'order_accepted' ? 'bg-yellow-600 dark:bg-yellow-400' :
        newStatus === 'order_in_progress' ? 'bg-orange-600 dark:bg-orange-400' :
        'bg-blue-600 dark:bg-blue-400';

      const statusText = 
        newStatus === 'order_completed' ? 'Order Completed' :
        newStatus === 'order_cancelled' ? 'Order Cancelled' : 
        newStatus === 'order_accepted' ? 'Order Accepted' :
        newStatus === 'order_in_progress' ? 'Order in Progress' :
        'Payment in Progress';

      // Update the order in allOrders array
      const orderIndex = allOrders.findIndex(order => order._id === orderId);
      if (orderIndex !== -1) {
        allOrders[orderIndex].order_status = newStatus;
      }

      // Update status in table
      const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
      if (orderRow) {
        const statusCell = orderRow.querySelector('.status-cell');
        if (statusCell) {
          statusCell.innerHTML = `
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}">
              <span class="w-2 h-2 rounded-full ${dotClass} mr-1.5"></span>
              ${statusText}
            </span>
          `;
        }
      }

      // Re-filter orders if there's an active filter
      const currentFilter = document.getElementById('statusFilter').value;
      const searchTerm = document.getElementById('searchOrder').value;
      if (currentFilter !== 'all' || searchTerm) {
        filterOrders();
      }

      // Remove new badge when status is updated
      const newBadge = orderRow.querySelector('.bg-blue-100');
      if (newBadge) {
        newBadge.remove();
      }

    } else {
      throw new Error(data.message || 'Failed to update status');
    }
  } catch (error) {
    
    // Revert the select value
    statusSelect.value = originalValue;
    
    // Show error feedback
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-red-600 text-white px-2 py-1 rounded text-xs z-50';
    tooltip.style.top = `${event.pageY - 30}px`;
    tooltip.style.left = `${event.pageX}px`;
    tooltip.textContent = 'Failed to update status!';
    document.body.appendChild(tooltip);
    
    setTimeout(() => tooltip.remove(), 2000);
  } finally {
    spinner.classList.add('hidden');
    statusSelect.disabled = false;
  }
}

// Add this function at the top of the script section
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show a tooltip or some feedback
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-gray-800 text-white px-2 py-1 rounded text-sm z-50';
    tooltip.style.top = `${event.pageY - 30}px`;
    tooltip.style.left = `${event.pageX}px`;
    tooltip.textContent = 'Copied!';
    document.body.appendChild(tooltip);
    
    setTimeout(() => tooltip.remove(), 1000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const ordersTableBody = document.querySelector('#orders-table-body');
  const modal = document.querySelector('#orderModal');
  const orderDetails = document.querySelector('#orderDetails');
  const closeModalBtn = document.querySelector('#closeModal');
  const searchInput = document.getElementById('searchOrder');
  const statusFilter = document.getElementById('statusFilter');
  
  let allOrders = []; // Store all orders
  
  // Add event listeners for search and filter
  searchInput.addEventListener('input', () => {
    filterOrders();
  });

  statusFilter.addEventListener('change', () => {
    filterOrders();
  });

  // Filter orders function
  function filterOrders() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    
    const filteredOrders = allOrders.filter(order => {
      // Search in order ID and customer name
      const orderIdMatch = order._id.toLowerCase().includes(searchTerm);
      const customerNameMatch = (
        (order.delivery_address[0]?.firstName?.toLowerCase() || '').includes(searchTerm) ||
        (order.delivery_address[0]?.lastName?.toLowerCase() || '').includes(searchTerm)
      );

      // Status filter
      const statusMatch = statusValue === 'all' || order.order_status === statusValue;

      return (orderIdMatch || customerNameMatch) && statusMatch;
    });

    // Update total count
    document.getElementById('total-orders-count').textContent = filteredOrders.length;
    
    // Render filtered orders
    renderFilteredOrders(filteredOrders);
  }

  // Fetch orders function
  async function fetchOrders() {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '../index.html';
        return;
      }

      const response = await fetch('/api/admin/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Store orders and sort by date
        allOrders = [...data.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Initial filter and render
        filterOrders();
      }
    } catch (error) {
      
    }
  }

  // Render filtered orders function
  function renderFilteredOrders(orders) {
    const ordersTableBody = document.getElementById('orders-table-body');
    
    ordersTableBody.innerHTML = orders.map(order => {
      const totalAmount = order.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      
      const statusClass = 
        order.order_status === 'order_completed' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
        order.order_status === 'order_cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
        order.order_status === 'order_accepted' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
        order.order_status === 'order_in_progress' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' :
        'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';

      const statusText = 
        order.order_status === 'order_completed' ? 'Order Completed' :
        order.order_status === 'order_cancelled' ? 'Order Cancelled' : 
        order.order_status === 'order_accepted' ? 'Order Accepted' :
        order.order_status === 'order_in_progress' ? 'Order in Progress' :
        'Payment in Progress';
      
      return `
        <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700" data-order-id="${order._id}">
          <td class="py-4 px-4 text-gray-900 dark:text-gray-300">
            <div class="flex items-center">
              <span 
                class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
                onclick="copyToClipboard('${order._id}')"
                title="Click to copy full ID"
              >
                #${order._id.substring(0, 6)}...
              </span>
              ${order.isNew ? `
                <span class="ml-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                  New
                </span>
              ` : ''}
            </div>
          </td>
          <td class="py-4 px-4 text-gray-900 dark:text-gray-300">${order.delivery_address[0]?.firstName} ${order.delivery_address[0]?.lastName}</td>
          <td class="py-4 px-4 text-gray-900 dark:text-gray-300">
            ${new Date(order.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </td>
          <td class="py-4 px-4 status-cell">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}">
              <span class="w-2 h-2 rounded-full ${
                order.order_status === 'order_completed' ? 'bg-green-600 dark:bg-green-400' :
                order.order_status === 'order_cancelled' ? 'bg-red-600 dark:bg-red-400' :
                order.order_status === 'order_accepted' ? 'bg-yellow-600 dark:bg-yellow-400' :
                order.order_status === 'order_in_progress' ? 'bg-orange-600 dark:bg-orange-400' :
                'bg-blue-600 dark:bg-blue-400'
              } mr-1.5"></span>
              ${statusText}
            </span>
          </td>
          <td class="py-4 px-4 text-gray-900 dark:text-gray-300">$${totalAmount.toFixed(2)}</td>
          <td class="py-4 px-4 text-center">
            <button 
              data-order='${JSON.stringify(order)}'
              class="view-details-btn text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              View Details
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Add click event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
      button.addEventListener('click', function() {
        const orderData = JSON.parse(this.dataset.order);
        showOrderDetails(orderData);
      });
    });
  }

  const closeModal = () => {
    modal.classList.add('hidden');
    // Refresh the orders list
    fetchOrders();
  };

  closeModalBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  fetchOrders();
});
