import { Activity, ActivityType } from '@/types/activities';

export interface EvaluationItemResult {
  id: string;
  isCorrect: boolean;
  userAnswer?: any;
  expectedAnswer?: any;
  feedback?: string;
}

export interface ActivityEvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalCount: number;
  itemResults: EvaluationItemResult[];
  summaryMessage: string;
}

/**
 * Normalizes text for comparison (lowercased, trimmed, trimmed punctuation)
 */
function clean(str: any): string {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/[\s\-_]+/g, ' ');
}

export function evaluateActivitySubmission(
  activity: Activity,
  answers: Record<string, any>,
  hintsUsedCount = 0
): ActivityEvaluationResult {
  const type = activity.activityType;
  const content: any = activity.content || {};
  const maxScore = Number(activity.points) || 100;
  const itemResults: EvaluationItemResult[] = [];

  let correctCount = 0;
  let totalCount = 0;

  switch (type) {
    case 'match_pairs': {
      const pairs: Array<{ id: string; left: string; right: string }> = content.pairs || [];
      totalCount = pairs.length;

      // Student answers: { [pairId]: rightIdOrText } or { [leftId]: matchedRightId }
      pairs.forEach((pair) => {
        const studentChoice = answers[pair.id];
        const isMatch =
          studentChoice === pair.id ||
          clean(studentChoice) === clean(pair.right) ||
          clean(studentChoice) === clean(pair.left);

        if (isMatch) correctCount++;
        itemResults.push({
          id: pair.id,
          isCorrect: Boolean(isMatch),
          userAnswer: studentChoice,
          expectedAnswer: pair.right,
          feedback: isMatch ? 'Correct match!' : `Expected: "${pair.right}"`,
        });
      });
      break;
    }

    case 'drag_drop': {
      const items: Array<{ id: string; text: string }> = content.items || [];
      const zones: Array<{ id: string; label: string; acceptsItemIds: string[] }> = content.zones || [];
      totalCount = items.length;

      // Student answers: { [itemId]: zoneId }
      const itemToValidZones = new Map<string, Set<string>>();
      zones.forEach((z) => {
        (z.acceptsItemIds || []).forEach((itemId) => {
          if (!itemToValidZones.has(itemId)) itemToValidZones.set(itemId, new Set());
          itemToValidZones.get(itemId)!.add(z.id);
        });
      });

      items.forEach((item) => {
        const studentZoneId = answers[item.id];
        const validZones = itemToValidZones.get(item.id);
        const isMatch = Boolean(validZones && validZones.has(studentZoneId));

        if (isMatch) correctCount++;
        const targetZone = zones.find((z) => z.id === studentZoneId);
        const expectedZoneNames = zones
          .filter((z) => validZones?.has(z.id))
          .map((z) => z.label)
          .join(' or ');

        itemResults.push({
          id: item.id,
          isCorrect: isMatch,
          userAnswer: targetZone?.label || studentZoneId,
          expectedAnswer: expectedZoneNames,
          feedback: isMatch ? 'Placed correctly!' : `Belongs in: ${expectedZoneNames}`,
        });
      });
      break;
    }

    case 'fill_blanks': {
      const questions: Array<{
        id: string;
        blanks: Array<{ id: string; answer: string; acceptableAlternatives?: string[] }>;
      }> = content.questions || [];

      questions.forEach((q) => {
        (q.blanks || []).forEach((blank) => {
          totalCount++;
          const studentInput = clean(answers[blank.id] || answers[q.id]);
          const expectedClean = clean(blank.answer);
          const alts = (blank.acceptableAlternatives || []).map(clean);

          const isMatch = studentInput === expectedClean || alts.includes(studentInput);
          if (isMatch) correctCount++;

          itemResults.push({
            id: blank.id,
            isCorrect: isMatch,
            userAnswer: answers[blank.id] || answers[q.id] || '(blank)',
            expectedAnswer: blank.answer,
            feedback: isMatch ? 'Correct answer!' : `Expected: "${blank.answer}"`,
          });
        });
      });
      break;
    }

    case 'word_scramble': {
      const words: Array<{ id: string; word: string }> = content.words || [];
      totalCount = words.length;

      // Student answers: { [wordId]: string }
      words.forEach((w) => {
        const studentInput = clean(answers[w.id]);
        const targetClean = clean(w.word);
        const isMatch = studentInput === targetClean;

        if (isMatch) correctCount++;
        itemResults.push({
          id: w.id,
          isCorrect: isMatch,
          userAnswer: answers[w.id] || '(unanswered)',
          expectedAnswer: w.word,
          feedback: isMatch ? 'Solved!' : `Unscrambled word was "${w.word}"`,
        });
      });
      break;
    }

    case 'arrange_order': {
      const items: Array<{ id: string; text: string; correctPosition: number }> = content.items || [];
      totalCount = items.length;

      // Student answers: { orderedIds: string[] } or { [itemId]: positionIndex }
      const orderedIds: string[] = Array.isArray(answers.orderedIds)
        ? answers.orderedIds
        : Object.entries(answers)
            .sort(([, posA], [, posB]) => Number(posA) - Number(posB))
            .map(([id]) => id);

      items.forEach((item) => {
        const studentPos = orderedIds.indexOf(item.id) + 1; // 1-indexed
        const isMatch = studentPos === item.correctPosition;

        if (isMatch) correctCount++;
        itemResults.push({
          id: item.id,
          isCorrect: isMatch,
          userAnswer: `Step #${studentPos}`,
          expectedAnswer: `Step #${item.correctPosition}`,
          feedback: isMatch ? 'Correct sequence position!' : `Should be position #${item.correctPosition}`,
        });
      });
      break;
    }

    case 'category_sort': {
      const items: Array<{ id: string; text: string; categoryId: string }> = content.items || [];
      const categories: Array<{ id: string; name: string }> = content.categories || [];
      totalCount = items.length;

      // Student answers: { [itemId]: categoryId }
      items.forEach((item) => {
        const studentCatId = answers[item.id];
        const isMatch = studentCatId === item.categoryId;

        if (isMatch) correctCount++;
        const targetCategory = categories.find((c) => c.id === item.categoryId);
        const studentCategory = categories.find((c) => c.id === studentCatId);

        itemResults.push({
          id: item.id,
          isCorrect: isMatch,
          userAnswer: studentCategory?.name || studentCatId || 'Uncategorized',
          expectedAnswer: targetCategory?.name || item.categoryId,
          feedback: isMatch ? 'Correct category!' : `Belongs in "${targetCategory?.name}"`,
        });
      });
      break;
    }

    case 'sequence': {
      const sequences: Array<{
        id: string;
        correctOption: string;
        ruleExplanation?: string;
      }> = content.sequences || [];
      totalCount = sequences.length;

      // Student answers: { [sequenceId]: chosenOption }
      sequences.forEach((seq) => {
        const studentChoice = clean(answers[seq.id]);
        const isMatch = studentChoice === clean(seq.correctOption);

        if (isMatch) correctCount++;
        itemResults.push({
          id: seq.id,
          isCorrect: isMatch,
          userAnswer: answers[seq.id] || '(none)',
          expectedAnswer: seq.correctOption,
          feedback: isMatch
            ? `Correct! ${seq.ruleExplanation || ''}`
            : `Expected: "${seq.correctOption}". ${seq.ruleExplanation || ''}`,
        });
      });
      break;
    }
  }

  // Safety fallback if no items configured
  if (totalCount === 0) {
    totalCount = 1;
    correctCount = 1;
  }

  const rawPercentage = Math.round((correctCount / totalCount) * 100);

  // Apply subtle hint penalty (e.g. 5% per hint used, capped at 25% max penalty)
  const hintPenaltyPercent = Math.min(hintsUsedCount * 5, 25);
  const percentage = Math.max(0, rawPercentage - hintPenaltyPercent);
  const score = Math.round((percentage / 100) * maxScore);

  let summaryMessage = 'Great effort! Practice makes perfect.';
  if (percentage === 100) {
    summaryMessage = 'Flawless victory! Outstanding mastery!';
  } else if (percentage >= 80) {
    summaryMessage = 'Superb performance! You conquered this challenge!';
  } else if (percentage >= 60) {
    summaryMessage = 'Well done! You passed the activity benchmark!';
  }

  return {
    score,
    maxScore,
    percentage,
    correctCount,
    totalCount,
    itemResults,
    summaryMessage,
  };
}
