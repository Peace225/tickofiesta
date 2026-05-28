import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [], // Liste des produits dans le panier
  },
  reducers: {
    // Ajouter un produit au panier
    addToCart: (state, action) => {
      // action.payload attend un objet : { id, name, type, product_id, amount, quantity }
      state.items.push(action.payload)
    },
    // Supprimer un produit par son index
    removeFromCart: (state, action) => {
      state.items.splice(action.payload, 1)
    },
    // Vider totalement le panier (après un paiement réussi)
    clearCart: (state) => {
      state.items = []
    }
  }
})

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions
export default cartSlice.reducer