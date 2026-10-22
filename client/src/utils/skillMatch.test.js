import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSkillMatch,
  getSkillMatchBreakdown,
  getSkillMatchBadgeStyle
} from './skillMatch.js';

describe('Skill Match Utility (PROJECT_CONTEXT.md rules)', () => {
  it('calculates the exact example from PROJECT_CONTEXT.md: Python, React, SQL -> knows Python, SQL = 67%', () => {
    const required = ['Python', 'React', 'SQL'];
    const userSkills = ['Python', 'SQL'];
    const match = calculateSkillMatch(required, userSkills);
    assert.strictEqual(match, 67);
  });

  it('handles case-insensitivity: "PYTHON" and "react" match "python" and "REACT"', () => {
    const required = ['PYTHON', 'REACT', 'docker'];
    const userSkills = ['python', 'ReAcT', 'DOCKER'];
    const match = calculateSkillMatch(required, userSkills);
    assert.strictEqual(match, 100);
  });

  it('trims leading and trailing whitespace around skills', () => {
    const required = ['  Python  ', ' React ', 'Node.js   '];
    const userSkills = ['Python', 'React', 'Node.js'];
    const match = calculateSkillMatch(required, userSkills);
    assert.strictEqual(match, 100);
  });

  it('returns 100% when team requires no specific skills (open to all)', () => {
    assert.strictEqual(calculateSkillMatch([], ['Python', 'React']), 100);
    assert.strictEqual(calculateSkillMatch(null, ['Python']), 100);
    assert.strictEqual(calculateSkillMatch(['   '], ['Python']), 100);
  });

  it('returns 0% when student has no skills listed but team requires skills', () => {
    assert.strictEqual(calculateSkillMatch(['Python', 'React'], []), 0);
    assert.strictEqual(calculateSkillMatch(['Python', 'React'], null), 0);
  });

  it('returns 100% when both required and user skills are empty', () => {
    assert.strictEqual(calculateSkillMatch([], []), 100);
  });

  it('returns 0% when there is zero overlap between required and student skills', () => {
    const required = ['Rust', 'Solidity', 'Go'];
    const userSkills = ['HTML', 'CSS', 'Figma'];
    assert.strictEqual(calculateSkillMatch(required, userSkills), 0);
  });

  it('correctly rounds percentages: 1 out of 3 = 33%, 2 out of 3 = 67%', () => {
    const required = ['A', 'B', 'C'];
    assert.strictEqual(calculateSkillMatch(required, ['A']), 33);
    assert.strictEqual(calculateSkillMatch(required, ['A', 'B']), 67);
    assert.strictEqual(calculateSkillMatch(required, ['A', 'B', 'C']), 100);
  });

  it('breakdown accurately identifies matched and missing skills', () => {
    const required = ['Python', 'React', 'FastAPI', 'AWS'];
    const userSkills = ['react', 'python', 'mongodb'];

    const breakdown = getSkillMatchBreakdown(required, userSkills);

    assert.strictEqual(breakdown.matchPercentage, 50); // 2 of 4
    assert.deepStrictEqual(breakdown.matchedSkills, ['Python', 'React']);
    assert.deepStrictEqual(breakdown.missingSkills, ['FastAPI', 'AWS']);
  });

  it('badge style returns appropriate variant and colors based on score thresholds', () => {
    const high = getSkillMatchBadgeStyle(85);
    assert.strictEqual(high.variant, 'success');
    assert.strictEqual(high.label, 'Great Match');

    const mid = getSkillMatchBadgeStyle(50);
    assert.strictEqual(mid.variant, 'warning');
    assert.strictEqual(mid.label, 'Partial Match');

    const low = getSkillMatchBadgeStyle(20);
    assert.strictEqual(low.variant, 'neutral');
    assert.strictEqual(low.label, 'Low Match');
  });
});
