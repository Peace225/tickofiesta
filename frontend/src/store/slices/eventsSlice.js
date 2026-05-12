import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabaseClient';

export const fetchEvents = createAsyncThunk(
  'events/fetchAll', 
  async (params = {}, { rejectWithValue }) => {
    try {
      let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('statut', 'validé')
    .order('created_at', { ascending: false });

      // Filtres
      if (params.search) {
        query = query.ilike('titre', `%${params.search}%`);
      }
      if (params.categorie_id) {
        query = query.eq('categorie_id', params.categorie_id);
      }
      if (params.date_debut) {
        query = query.gte('date_debut', params.date_debut);
      }

      // Pagination
      const limit = params.limit || 50;
      const page = params.page || 1;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById', 
  async (id, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

      if (error) throw error;
      return { data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState: { 
    list: [], 
    current: null, 
    loading: false, 
    error: null, 
    total: 0, 
    pages: 1 
  },
  reducers: {
    clearCurrent: (state) => {
      state.current = null;
    }
  },
  extraReducers: (builder) => {
    builder
   .addCase(fetchEvents.pending, (state) => { 
        state.loading = true;
        state.error = null;
      })
   .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
   .addCase(fetchEvents.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload;
        state.list = [];
      })
   .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
   .addCase(fetchEventById.fulfilled, (state, action) => { 
        state.loading = false;
        state.current = action.payload.data; 
      })
   .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrent } = eventsSlice.actions;
export default eventsSlice.reducer;