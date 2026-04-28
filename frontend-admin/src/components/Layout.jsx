import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Layout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div>
      <header style={{ padding: '20px', background: '#333', color: 'white' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Link to="/" style={{ color: 'white', marginRight: '20px' }}>Dashboard</Link>
            <Link to="/menu" style={{ color: 'white', marginRight: '20px' }}>Thực đơn</Link>
            <Link to="/orders" style={{ color: 'white', marginRight: '20px' }}>Đơn hàng</Link>
            <Link to="/tables" style={{ color: 'white', marginRight: '20px' }}>Bàn</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/staff" style={{ color: 'white', marginRight: '20px' }}>Nhân viên</Link>
            )}
          </div>
          <div>
            <span style={{ marginRight: '20px' }}>{user?.fullName} ({user?.role})</span>
            <button onClick={handleLogout}>Đăng xuất</button>
          </div>
        </nav>
      </header>
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
