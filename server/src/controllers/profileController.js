import { supabaseAdmin } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export const getMyProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return next(new AppError(error.message, 400));
    }

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (err) {
    next(err);
  }
};

export const getProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, department, academic_year, skills, interests, experience, role, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
};
