import { supabaseAdmin } from '../config/supabase.js';

/**
 * 🗳️ LOGIQUE DE VOTE (XXL Style)
 */
export const voter = async (req, res) => {
  res.json({ success: true, message: "Vote reçu" });
};

export const getVotesActifs = async (req, res) => {
  res.json({ success: true, data: [] });
};

export const getVotesPasses = async (req, res) => {
  res.json({ success: true, data: [] });
};

export const getCandidats = async (req, res) => {
  res.json({ success: true, data: [] });
};

export const getResultatsEvent = async (req, res) => {
  res.json({ success: true, data: [] });
};

export const acheterPack = async (req, res) => {
  res.json({ success: true, message: "Pack acheté" });
};

export const getMonSolde = async (req, res) => {
  res.json({ success: true, solde: 0 });
};

export const addCandidat = async (req, res) => {
  res.json({ success: true });
};

export const toggleVote = async (req, res) => {
  res.json({ success: true });
};