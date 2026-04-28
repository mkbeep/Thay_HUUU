import { createSlice } from '@reduxjs/toolkit';

const tableSlice = createSlice({
  name: 'table',
  initialState: {
    tableId: null,
    sessionId: null,
    startTime: null,
  },
  reducers: {
    setTableSession: (state, action) => {
      state.tableId = action.payload.tableId;
      state.sessionId = action.payload.sessionId;
      state.startTime = action.payload.startTime;
    },
    clearTableSession: (state) => {
      state.tableId = null;
      state.sessionId = null;
      state.startTime = null;
    },
  },
});

export const { setTableSession, clearTableSession } = tableSlice.actions;
export default tableSlice.reducer;
