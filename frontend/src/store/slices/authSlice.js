import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabaseClient';

// --- HELPER : Messages d'erreur FR ---
const getErrorMessage = (error) => {
  if (!error) return 'Une erreur est survenue';
  if (error.message === 'Invalid login credentials') return 'Identifiant ou mot de passe incorrect';
  if (error.message === 'Email not confirmed') return 'Confirme ton email avant de te connecter';
  if (error.message === 'User already registered') return 'Cet utilisateur est déjà enregistré';
  return error.message || 'Une erreur est survenue';
};

// --- CONNEXION ---
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    // credentials.email contient maintenant soit un vrai email (organisateur), 
    // soit le format fictif @participant.tickofiesta.ci (client)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    // Récupération du profil complet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) console.error("Erreur récupération profil:", profileError);

    const fullUser = { 
      ...data.user, 
      role: profile?.role || 'client',
      nom: profile?.nom || '',
      telephone: profile?.telephone || '',
      avatar_url: profile?.avatar_url || null
    };

    return { user: fullUser, session: data.session };
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// --- INSCRIPTION ---
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.trim(),
      password: userData.password,
      options: {
        data: { 
          nom: userData.nom, 
          role: userData.role || 'client',
          telephone: userData.telephone || '' 
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    if (error) throw error;
    if (!data.session) return { message: 'Vérifie tes emails pour confirmer ton compte' };
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// --- SESSION INITIALE ---
export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) return { user: null, session: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    const fullUser = { 
      ...session.user, 
      role: profile?.role || 'client',
      nom: profile?.nom || '',
      telephone: profile?.telephone || '',
      avatar_url: profile?.avatar_url || null
    };
    return { user: fullUser, session };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// --- DÉCONNEXION ---
export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { 
    user: null, 
    session: null, 
    loading: false, 
    error: null, 
    initialized: false 
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user || action.payload;
      state.session = action.payload.session || null;
      state.loading = false;
      state.error = null;
      state.initialized = true;
    },
    clearError: (state) => { state.error = null; },
    forceLogout: (state) => {
      state.user = null;
      state.session = null;
      state.initialized = true;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { 
        state.loading = false; 
        state.user = action.payload.user; 
        state.session = action.payload.session; 
        state.initialized = true; 
      })
      .addCase(login.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
        state.initialized = true;
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => { 
        state.loading = false; 
        state.user = action.payload.user || null; 
        state.session = action.payload.session || null;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
        state.initialized = true;
      })
      .addCase(getMe.pending, (state) => { state.loading = true; })
      .addCase(getMe.fulfilled, (state, action) => { 
        state.loading = false;
        state.user = action.payload.user; 
        state.session = action.payload.session;
        state.initialized = true; 
      })
      .addCase(getMe.rejected, (state, action) => { 
        state.loading = false;
        state.error = action.payload;
        state.initialized = true; 
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.error = null;
        state.initialized = true;
      });
  },
});

export const { loginSuccess, clearError, forceLogout, updateUser } = authSlice.actions;
export default authSlice.reducer;