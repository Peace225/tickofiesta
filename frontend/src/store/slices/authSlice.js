import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabaseClient';

// --- HELPER : Messages d'erreur FR ---
const getErrorMessage = (error) => {
  if (error.message === 'Invalid login credentials') return 'Identifiant ou mot de passe incorrect';
  if (error.message === 'Email not confirmed') return 'Confirme ton email avant de te connecter';
  if (error.message === 'User already registered') return 'Cet identifiant est déjà utilisé';
  return error.message || 'Une erreur est survenue';
};

// --- CONNEXION (Email ou Téléphone) ---
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    // On construit l'objet dynamiquement pour supporter l'email OU le téléphone
    const authPayload = {
      password: credentials.mot_de_passe || credentials.password,
    };

    if (credentials.email) {
      authPayload.email = credentials.email;
    } else if (credentials.phone) {
      authPayload.phone = credentials.phone;
    }

    const { data, error } = await supabase.auth.signInWithPassword(authPayload);

    if (error) throw error;
    return data; // { user, session }
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// --- INSCRIPTION ---
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const authPayload = {
      password: userData.mot_de_passe || userData.password,
      options: {
        data: {
          nom: userData.nom,
          role: userData.role || 'client',
        },
        emailRedirectTo: `${window.location.origin}/login` // Pour confirmer email
      }
    };

    // Ajout dynamique (pour gérer l'inscription email vs téléphone plus tard si besoin)
    if (userData.email) authPayload.email = userData.email;
    if (userData.phone) authPayload.phone = userData.phone;

    const { data, error } = await supabase.auth.signUp(authPayload);

    if (error) throw error;
    
    // Si email confirmation active, user sera null
    if (!data.session && userData.email) {
      return rejectWithValue('Vérifie tes emails pour confirmer ton compte');
    }
    
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// --- RÉCUPÉRATION SESSION INITIALE ---
export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    return { 
      user: session?.user || null, 
      session: session || null 
    };
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
    loginSuccess: (state, action) => {
      state.user = action.payload.user || action.payload;
      state.session = action.payload.session || null;
      state.loading = false;
      state.error = null;
      state.initialized = true;
    },
    clearError: (state) => { 
      state.error = null; 
    },
    forceLogout: (state) => {
      state.user = null;
      state.session = null;
      state.initialized = true;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
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
      
      // REGISTER
      .addCase(register.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(register.fulfilled, (state, action) => { 
        state.loading = false; 
        state.user = action.payload.user; 
        state.session = action.payload.session;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      // GET ME
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
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

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { loginSuccess, clearError, forceLogout } = authSlice.actions;
export default authSlice.reducer;