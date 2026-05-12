import { createSlice } from '@reduxjs/toolkit';

const initialDark = localStorage.getItem('theme') === 'dark';

const themeSlice = createSlice({
  name: 'theme',
  initialState: { dark: initialDark },
  reducers: {
    toggleTheme: (state) => {
      state.dark = !state.dark;
      localStorage.setItem('theme', state.dark ? 'dark' : 'light');
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
