import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {
    setMenuItems: (state, action) => {
      state.items = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setMenuItems, setLoading } = menuSlice.actions;
export default menuSlice.reducer;
