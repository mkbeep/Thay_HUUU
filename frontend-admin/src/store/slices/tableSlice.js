import { createSlice } from '@reduxjs/toolkit';

const tableSlice = createSlice({
  name: 'tables',
  initialState: {
    tables: [],
    loading: false,
  },
  reducers: {
    setTables: (state, action) => {
      state.tables = action.payload;
    },
  },
});

export const { setTables } = tableSlice.actions;
export default tableSlice.reducer;
