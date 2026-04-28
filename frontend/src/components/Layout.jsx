import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <header>
        <h1>Quản lý nhà hàng</h1>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
