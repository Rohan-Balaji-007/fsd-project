/**
 * Skill match utility for collegiate team formation.
 *
 * Business rule from PROJECT_CONTEXT.md:
 * match% = round(matched_required_skills / total_required_skills * 100).
 * Case-insensitive, trimmed.
 * Example: team needs Python, React, SQL; student knows Python, SQL -> 67%.
 */

/**
 * Calculates skill match percentage (0 - 100).
 *
 * @param {string[]} requiredSkills - Skills required by team
 * @param {string[]} userSkills - Skills possessed by user
 * @returns {number} match percentage rounded to nearest whole integer
 */
export const calculateSkillMatch = (requiredSkills = [], userSkills = []) => {
  // If team has no required skills, it's open to everyone (100% match)
  if (!requiredSkills || requiredSkills.length === 0) {
    return 100;
  }

  // Filter out empty or whitespace-only entries in required skills
  const cleanRequired = requiredSkills
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  if (cleanRequired.length === 0) {
    return 100;
  }

  // If user has no skills listed, match is 0%
  if (!userSkills || userSkills.length === 0) {
    return 0;
  }

  const normalizedUserSkills = new Set(
    userSkills
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim().toLowerCase())
  );

  let matchedCount = 0;
  for (const skill of cleanRequired) {
    if (normalizedUserSkills.has(skill.toLowerCase())) {
      matchedCount++;
    }
  }

  return Math.round((matchedCount / cleanRequired.length) * 100);
};

/**
 * Returns a detailed breakdown of matched and missing skills.
 *
 * @param {string[]} requiredSkills - Skills required by team
 * @param {string[]} userSkills - Skills possessed by user
 * @returns {{ matchPercentage: number, matchedSkills: string[], missingSkills: string[] }}
 */
export const getSkillMatchBreakdown = (requiredSkills = [], userSkills = []) => {
  const cleanRequired = (requiredSkills || [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  if (cleanRequired.length === 0) {
    return {
      matchPercentage: 100,
      matchedSkills: [],
      missingSkills: []
    };
  }

  const normalizedUserSkills = new Set(
    (userSkills || [])
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim().toLowerCase())
  );

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of cleanRequired) {
    if (normalizedUserSkills.has(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchPercentage = Math.round((matchedSkills.length / cleanRequired.length) * 100);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills
  };
};

/**
 * Returns badge styling attributes for a given skill match score.
 *
 * @param {number} score - 0 to 100
 * @returns {{ label: string, variant: string, color: string, bg: string, border: string }}
 */
export const getSkillMatchBadgeStyle = (score) => {
  if (score >= 70) {
    return {
      label: 'Great Match',
      variant: 'success',
      color: 'var(--color-success-dark, #047857)',
      bg: 'var(--color-success-light, #ecfdf5)',
      border: 'rgba(16, 185, 129, 0.3)'
    };
  }
  if (score >= 40) {
    return {
      label: 'Partial Match',
      variant: 'warning',
      color: 'var(--color-warning-dark, #b45309)',
      bg: 'var(--color-warning-light, #fffbeb)',
      border: 'rgba(245, 158, 11, 0.3)'
    };
  }
  return {
    label: 'Low Match',
    variant: 'neutral',
    color: 'var(--text-muted, #64748b)',
    bg: 'var(--bg-subtle, #f1f5f9)',
    border: 'var(--border-light, #e2e8f0)'
  };
};
