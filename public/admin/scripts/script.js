async function fetchUserStats() {
try {
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = '../index.html';
  return;
}

const totalUsersResponse = await fetch('/api/admin/total-users', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
});

const activeUsersResponse = await fetch('/api/admin/active-users', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
});

const totalUsersData = await totalUsersResponse.json();
const activeUsersData = await activeUsersResponse.json();

// Check if response is successful and has data
if (totalUsersData.status === 'success') {
  document.getElementById('totalUsers').textContent = totalUsersData.data || '0';
} else {
  document.getElementById('totalUsers').textContent = '0';
}

if (activeUsersData.status === 'success') {
  document.getElementById('activeUsers').textContent = activeUsersData.data || '0';
} else {
  document.getElementById('activeUsers').textContent = '0';
}
} catch (error) {

document.getElementById('totalUsers').textContent = '0';
document.getElementById('activeUsers').textContent = '0';
}
}
async function fetchTotalRevenue() {
try {
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = '../index.html';
  return;
}

const response = await fetch('/api/admin/total-revenue', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
});

const revenueData = await response.json();

if (revenueData.success && revenueData.data) {
  document.getElementById('totalRevenue').textContent = `$${revenueData.data}`;
} else {
  document.getElementById('totalRevenue').textContent = '$0.00';
}
} catch (error) {

document.getElementById('totalRevenue').textContent = 'Error';
}
}
async function fetchOrderStatusData() {
try {
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = '../index.html';
  return;
}

const response = await fetch('/api/admin/order-status', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
});

const orderStatusData = await response.json();

if (orderStatusData.success) {
  const successfulOrders = orderStatusData.data.successfulOrders;
  const cancelledOrders = orderStatusData.data.cancelledOrders;
  
  // Update Order Status Chart
  orderStatusChart.data.datasets[0].data = successfulOrders;
  orderStatusChart.data.datasets[1].data = cancelledOrders;
  orderStatusChart.update();
} else {
  
}

} catch (error) {

}
}

async function fetchTotalOrdersData() {
try {
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = '../index.html';
  return;
}

const response = await fetch('/api/admin/total-orders', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
});

const totalOrdersData = await response.json();

if (totalOrdersData.success) {
  const totalOrders = totalOrdersData.data.totalOrders;

  // Update Total Orders Chart
  totalOrdersChart.data.datasets[0].data = totalOrders;
  totalOrdersChart.update();
} else {
  
}

} catch (error) {

}
}

async function fetchRecentOrders() {
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
  // Get last 5 orders and add isNew flag
  const recentOrders = data.data
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(order => ({
      ...order,
      isNew: (Date.now() - new Date(order.createdAt).getTime()) < 24 * 60 * 60 * 1000
    }));
  
  const ordersTableBody = document.getElementById('recent-orders-table');
  
  ordersTableBody.innerHTML = recentOrders.map(order => {
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
              title="Click to copy"
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
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
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
        <td class="px-4 py-2 text-center">
          <button 
            onclick='showOrderDetails(${JSON.stringify(order)})' 
            class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Details
          </button>
        </td>
      </tr>
    `;
  }).join('');
}
} catch (error) {

}
}

// Show order details in modal
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

// Add copy to clipboard function
function copyToClipboard(text) {
navigator.clipboard.writeText(text).then(() => {
const tooltip = document.createElement('div');
tooltip.className = 'fixed bg-gray-800 text-white px-2 py-1 rounded text-sm z-50';
tooltip.style.top = `${event.pageY - 30}px`;
tooltip.style.left = `${event.pageX}px`;
tooltip.textContent = 'Copied!';
document.body.appendChild(tooltip);

setTimeout(() => tooltip.remove(), 1000);
});
}

// Add update order status function
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

  // Update status in table
  const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
  if (orderRow) {
    const statusCell = orderRow.querySelector('.status-cell');
    if (statusCell) {
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

      statusCell.innerHTML = `
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}">
          <span class="w-2 h-2 rounded-full ${dotClass} mr-1.5"></span>
          ${statusText}
        </span>
      `;
    }
  }

  // Refresh all dashboard data
  fetchUserStats();
  fetchTotalRevenue();
  fetchOrderStatusData();
  fetchTotalOrdersData();
  fetchRecentOrders();

} else {
  throw new Error(data.message || 'Failed to update status');
}
} catch (error) {

statusSelect.value = originalValue;

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

// Add modal close functionality
document.addEventListener('DOMContentLoaded', () => {
const modal = document.querySelector('#orderModal');
const closeModalBtn = document.querySelector('#closeModal');

const closeModal = () => {
modal.classList.add('hidden');
// Refresh all dashboard data
fetchUserStats();
fetchTotalRevenue();
fetchOrderStatusData();
fetchTotalOrdersData();
fetchRecentOrders();
};

closeModalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
if (e.target === modal) {
  closeModal();
}
});
});

// Fetch data for the charts
fetchUserStats();
fetchTotalRevenue();
fetchOrderStatusData();
fetchTotalOrdersData();
fetchRecentOrders();

// Initialize the charts (Order Status)
var ctx = document.getElementById('orderStatusChart').getContext('2d');
var orderStatusChart = new Chart(ctx, {
type: 'line',
data: {
labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
datasets: [
  { label: 'Completed Orders', data: [75, 80, 85, 90, 92, 95], borderColor: 'rgba(76, 175, 80, 1)', backgroundColor: 'rgba(76, 175, 80, 0.2)', borderWidth: 2 },
  { label: 'Cancelled Orders', data: [25, 20, 15, 10, 8, 5], borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', borderWidth: 2 }
]
},
options: { responsive: true }
});

// Initialize the charts (Total Orders)
var ctx2 = document.getElementById('totalOrdersChart').getContext('2d');
var totalOrdersChart = new Chart(ctx2, {
type: 'bar',
data: {
labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
datasets: [
  {
    label: 'Total Orders',
    data: [120, 130, 140, 150, 160, 170],
    backgroundColor: 'rgba(0, 123, 255, 0.6)',
    borderColor: 'rgba(0, 123, 255, 1)',
    borderWidth: 2
  }
]
},
options: { responsive: true }
});
