import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    items: [],
    loading: false,
    categories: [],
  },
  reducers: {
    setMenuItems: (state, action) => {
      state.items = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
  },
});

export const { setMenuItems, setLoading, setCategories } = menuSlice.actions;
export default menuSlice.reducer;
