import { createSlice } from '@reduxjs/toolkit';

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    staff: [],
    loading: false,
  },
  reducers: {
    setStaff: (state, action) => {
      state.staff = action.payload;
    },
    addStaff: (state, action) => {
      state.staff.push(action.payload);
    },
  },
});

export const { setStaff, addStaff } = staffSlice.actions;
export default staffSlice.reducer;
