import { supabaseAdmin } from '../services/supabase.js';

/**
 * Authentication Middleware
 * Verifies Supabase JWT from Authorization: Bearer <token>
 * Attaches authenticated user and their profile to req.user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Bearer token is empty'
      });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired session'
      });
    }

    // Retrieve corresponding profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    req.user = {
      ...user,
      profile: profile || null,
      role: profile?.role || 'student'
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware] Verification failed:', err);
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failure'
    });
  }
};

/**
 * Optional Auth Middleware
 * If Authorization header exists, validates and attaches req.user.
 * If not present, proceeds without error.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    req.user = {
      ...user,
      profile: profile || null,
      role: profile?.role || 'student'
    };

    next();
  } catch (err) {
    req.user = null;
    next();
  }
};
