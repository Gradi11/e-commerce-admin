let products = [];
  
  // Fetch products on page load
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '../index.html';
        return;
      }

      // Changed API endpoint to admin products
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get the error response text
        throw new Error(`Failed to fetch products: ${errorText}`);
      }

      const data = await response.json();
      console.log('Products data:', data); // Debug log
      
      if (data.success) {
        products = data.data;
        
        // Populate product dropdown
        const productSelect = document.getElementById('product');
        productSelect.innerHTML = `
          <option value="">Select Product</option>
          ${products.map(product => `
            <option value="${product._id}">${product.name} - $${product.price}</option>
          `).join('')}
        `;
      } else {
        console.error('Failed to fetch products:', data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  });

  // Update size and color options when product changes
  document.getElementById('product').addEventListener('change', (e) => {
    const productId = e.target.value;
    console.log('Selected product ID:', productId); // Debug log
    const product = products.find(p => p._id === productId);
    
    if (product) {
      console.log('Found product:', product); // Debug log
      
      // Update sizes dropdown
      const sizeSelect = document.getElementById('size');
      sizeSelect.innerHTML = `
        <option value="">Select Size</option>
        ${product.sizes.map(size => `
          <option value="${size}">${size}</option>
        `).join('')}
      `;
      
      // Update colors dropdown
      const colorSelect = document.getElementById('color');
      colorSelect.innerHTML = `
        <option value="">Select Color</option>
        ${product.colors.map(color => `
          <option value="${color}">${color}</option>
        `).join('')}
      `;
    }
  });

  function showDialog(success, message) {
    const dialog = document.getElementById('alertDialog');
    const title = document.getElementById('dialogTitle');
    const messageEl = document.getElementById('dialogMessage');
    const button = document.getElementById('dialogButton');
    const successIcon = document.getElementById('successIcon');
    const errorIcon = document.getElementById('errorIcon');

    // Set content based on success/error
    if (success) {
      title.textContent = 'Success!';
      successIcon.classList.remove('hidden');
      errorIcon.classList.add('hidden');
      button.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
      button.classList.remove('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-500');
    } else {
      title.textContent = 'Error!';
      successIcon.classList.add('hidden');
      errorIcon.classList.remove('hidden');
      button.classList.add('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-500');
      button.classList.remove('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
    }

    messageEl.textContent = message;
    button.textContent = success ? 'Continue' : 'Try Again';

    // Show dialog
    dialog.classList.remove('hidden');

    // Add click handler to button
    button.onclick = () => {
      dialog.classList.add('hidden');
      if (success) {
        window.location.href = '../orders/index.html';
      }
    };
  }

  // Update form submission handler
  document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      const formData = {
        productId: document.getElementById('product').value,
        quantity: parseInt(document.getElementById('quantity').value),
        size: document.getElementById('size').value,
        color: document.getElementById('color').value,
        delivery_address: [{
          firstName: document.getElementById('firstName').value,
          lastName: document.getElementById('lastName').value,
          phoneNumber: document.getElementById('phoneNumber').value,
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          country: document.getElementById('country').value,
          state: document.getElementById('state').value,
          postalCode: document.getElementById('postalCode').value
        }],
        delivery_option: document.getElementById('deliveryOption').value,
        payment_status: document.getElementById('paymentStatus').value.toLowerCase(),
        order_status: document.getElementById('orderStatus').value.toLowerCase()
      };

      // Validate required fields
      if (!formData.productId) {
        throw new Error('Please select a product');
      }
      if (!formData.quantity || formData.quantity < 1) {
        throw new Error('Please enter a valid quantity');
      }
      if (!formData.delivery_address[0].firstName || !formData.delivery_address[0].lastName) {
        throw new Error('Please enter customer name');
      }
      if (!formData.delivery_address[0].phoneNumber) {
        throw new Error('Please enter phone number');
      }
      if (!formData.delivery_address[0].address || !formData.delivery_address[0].city) {
        throw new Error('Please enter complete address');
      }

      console.log('Submitting order:', formData);

      const response = await fetch('/api/admin/orders/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        showDialog(true, 'Order has been created successfully!');
      } else {
        showDialog(false, data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error adding order:', error);
      showDialog(false, error.message);
    }
  });

  // Theme toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  
  themeToggle.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  });
