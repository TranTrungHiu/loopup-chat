document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    // Placeholder cho API sau này
    if (username === 'admin' && password === '1234') {
      document.getElementById('message').style.color = 'green';
      document.getElementById('message').textContent = 'Đăng nhập thành công!';
    } else {
      document.getElementById('message').textContent = 'Sai tài khoản hoặc mật khẩu!';
    }
  });
  