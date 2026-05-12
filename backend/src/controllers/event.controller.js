import { supabaseAdmin } from '../config/supabase.js';

export const getEvents = async (req, res) => {
  res.json({ success: true, message: "Route Events OK" });
};

export const getEventById = async (req, res) => {
  res.json({ success: true });
};

export const createEvent = async (req, res) => {
  res.json({ success: true });
};

export const updateEvent = async (req, res) => {
  res.json({ success: true });
};

export const deleteEvent = async (req, res) => {
  res.json({ success: true });
};

export const updateEventStatut = async (req, res) => {
  res.json({ success: true });
};

export const getMesEvenements = async (req, res) => {
  res.json({ success: true });
};

export const getOrgStats = async (req, res) => {
  res.json({ success: true });
};