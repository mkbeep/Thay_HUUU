import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  role: null,
};

// Kiểm tra token khi khởi tạo
if (initialState.token) {
  try {
    const decoded = jwtDecode(initialState.token);
    if (decoded.exp * 1000 > Date.now()) {
      initialState.user = decoded;
      initialState.role = decoded.role;
      initialState.isAuthenticated = true;
    } else {
      localStorage.removeItem('token');
      initialState.token = null;
    }
  } catch (error) {
    localStorage.removeItem('token');
    initialState.token = null;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token } = action.payload;
      const decoded = jwtDecode(token);
      
      state.user = decoded;
      state.token = token;
      state.role = decoded.role;
      state.isAuthenticated = true;
      
      localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
