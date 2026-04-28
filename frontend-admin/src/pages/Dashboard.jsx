import React from 'react';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Xin chào, {user?.fullName}!</p>
      <p>Vai trò: {user?.role}</p>
    </div>
  );
};

export default Dashboard;
