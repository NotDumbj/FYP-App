import { createSlice } from '@reduxjs/toolkit';

const storedAuth = localStorage.getItem("auth");

const initialState = {
  user: storedAuth ? JSON.parse(storedAuth).user : null,
  token: storedAuth ? JSON.parse(storedAuth).token : null,
  isAuthenticated: storedAuth ? true : false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;