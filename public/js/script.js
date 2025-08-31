const adminCredentials = {
    username: 'PAKAD',
    password: 'Pakad0125'
  };
  
  // Show alert function
  function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 z-50 p-4 text-sm rounded-lg shadow-md ${
      type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
  
    alert.innerText = message;
    document.body.appendChild(alert);
  
    setTimeout(() => {
      alert.remove();
    }, 3000);
  }
  
  function generateToken() {
    return btoa(`${adminCredentials.username}:${new Date().getTime()}`);
  }
  
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    if (username === adminCredentials.username && password === adminCredentials.password) {
      const token = generateToken();
      localStorage.setItem('adminToken', token);
      showAlert('Login successful!', 'success');
      window.location.href = 'admin/dashboard.html'; // Redirect to dashboard
    } else {
      showAlert('Invalid credentials. Please try again.', 'error');
    }
  });
  