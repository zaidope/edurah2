import { QuizQuestion } from '@/types';

export interface ParsedQuizDraft {
  title: string;
  description: string;
  questions: QuizQuestion[];
  rawText?: string;
  warnings?: string[];
}

/**
 * Intelligent Text-to-Quiz Question Extractor
 * Parses text strings from PDF documents looking for question boundaries,
 * option markers (A/B/C/D, 1/2/3/4), answer keys, and explanations.
 */
export function extractQuestionsFromText(rawText: string): ParsedQuizDraft {
  const warnings: string[] = [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return {
      title: 'Generated Assessment Quiz',
      description: 'Extracted from uploaded assessment document.',
      questions: [],
      warnings: ['Document was empty or text could not be extracted.'],
    };
  }

  // Attempt to deduce Title
  let docTitle = 'Generated Assessment Quiz';
  if (lines[0] && lines[0].length < 100 && !lines[0].match(/^(Question|\d+\.|\d+\))/i)) {
    docTitle = lines[0].replace(/^(Quiz|Test|Exam|Assessment):\s*/i, '');
  }

  const questions: QuizQuestion[] = [];
  let currentQuestion: Partial<QuizQuestion> | null = null;
  let currentOptions: string[] = [];
  let currentExplanation = '';

  // Regex patterns
  const questionStartRegex = /^(?:Question\s*(\d+)[:.]?|Q(\d+)[:.]?|(\d+)[\.\)])\s*(.*)$/i;
  const optionRegex = /^(?:\(?([A-Da-d1-4])\)?[.:\s]+|\[([A-Da-d1-4])\]\s*)(.*)$/;
  const answerKeyRegex = /^(?:Correct\s*Answer|Answer|Ans)[:\s]+(?:\(?([A-Da-d1-4])\)?|(.*))$/i;
  const explanationRegex = /^(?:Explanation|Reason|Note)[:\s]+(.*)$/i;

  function commitCurrentQuestion() {
    if (currentQuestion && currentQuestion.question) {
      // If no options were found, generate standard True/False or default options
      let finalOptions = [...currentOptions];
      let finalAnswerIndex = currentQuestion.correctAnswerIndex ?? 0;

      if (finalOptions.length < 2) {
        finalOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
        finalAnswerIndex = 0;
      }

      questions.push({
        id: `q-gen-${Date.now()}-${questions.length + 1}`,
        question: currentQuestion.question.trim(),
        options: finalOptions,
        correctAnswerIndex: Math.min(Math.max(0, finalAnswerIndex), finalOptions.length - 1),
        explanation: currentExplanation.trim() || 'Refer to the curriculum chapter notes for step-by-step verification.'
      });
    }
    currentQuestion = null;
    currentOptions = [];
    currentExplanation = '';
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Question start
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      commitCurrentQuestion();
      currentQuestion = {
        question: qMatch[4] || line,
        correctAnswerIndex: 0,
      };
      continue;
    }

    // Check for Answer Key
    const ansMatch = line.match(answerKeyRegex);
    if (ansMatch) {
      const ansLetter = (ansMatch[1] || '').toUpperCase();
      let index = 0;
      if (ansLetter === 'A' || ansLetter === '1') index = 0;
      else if (ansLetter === 'B' || ansLetter === '2') index = 1;
      else if (ansLetter === 'C' || ansLetter === '3') index = 2;
      else if (ansLetter === 'D' || ansLetter === '4') index = 3;
      else {
        // Search in options
        const found = currentOptions.findIndex(o => o.toLowerCase().includes((ansMatch[2] || '').toLowerCase()));
        if (found >= 0) index = found;
      }
      if (currentQuestion) {
        currentQuestion.correctAnswerIndex = index;
      }
      continue;
    }

    // Check for Explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      currentExplanation = expMatch[1] || '';
      continue;
    }

    // Check for Option
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      const optText = optMatch[3] ? optMatch[3].trim() : line;
      currentOptions.push(optText);
      continue;
    }

    // Otherwise continuation line
    if (currentQuestion) {
      if (currentOptions.length > 0) {
        // Append to last option
        currentOptions[currentOptions.length - 1] += ` ${line}`;
      } else {
        // Append to question text
        currentQuestion.question += ` ${line}`;
      }
    }
  }

  commitCurrentQuestion();

  if (questions.length === 0) {
    warnings.push('Could not detect distinct numbered questions. You can add questions manually or review the text below.');
  }

  return {
    title: docTitle,
    description: `Assessment containing ${questions.length} questions extracted from document.`,
    questions,
    rawText,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Parses raw ArrayBuffer / File from a PDF.
 * Extracts standard PDF text streams if available, or falls back to text reader.
 */
export async function parsePdfFile(file: File): Promise<ParsedQuizDraft> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        // Simple text extractor from PDF stream objects:
        // Decodes printable text between BT (Begin Text) and ET (End Text) or Tj/TJ operators
        let extractedText = '';
        const rawContent = new TextDecoder('latin1').decode(bytes);

        // Match text blocks in PDF streams
        const textSnippets: string[] = [];
        const regex = /\((.*?)\)\s*Tj/g;
        let match;
        while ((match = regex.exec(rawContent)) !== null) {
          textSnippets.push(match[1]);
        }

        // Also match array-based text strings: [(text) 20 (more)] TJ
        const arrayRegex = /\[(.*?)\]\s*TJ/g;
        while ((match = arrayRegex.exec(rawContent)) !== null) {
          const innerMatches = match[1].match(/\((.*?)\)/g);
          if (innerMatches) {
            textSnippets.push(innerMatches.map(m => m.replace(/[()]/g, '')).join(' '));
          }
        }

        if (textSnippets.length > 0) {
          extractedText = textSnippets.join('\n');
        } else {
          // Fallback: search for plaintext lines inside file
          extractedText = rawContent
            .replace(/[^\x20-\x7E\n\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/(Question \d+|Q\d+|\d+\.)/g, '\n$1');
        }

        const draft = extractQuestionsFromText(extractedText);
        resolve(draft);
      } catch (err: any) {
        resolve({
          title: file.name.replace('.pdf', ''),
          description: 'Uploaded document',
          questions: [],
          warnings: ['Could not parse PDF encoding. Please use the Sample Exam or manually input questions.']
        });
      }
    };

    reader.onerror = () => {
      resolve({
        title: file.name,
        description: 'Failed to read file',
        questions: [],
        warnings: ['File read failed.']
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Pre-packaged Sample Exam documents for instant testing of the PDF Quiz Maker
 */
export const SAMPLE_EXAMS: Record<string, string> = {
  primaryMath: `Grade 1 Mathematics Quick Quiz
Question 1: How many sides does a triangle have?
A) 2 sides
B) 3 sides
C) 4 sides
D) 0 sides
Answer: B
Explanation: A triangle is a polygon with exactly three straight edges and three vertices.

Question 2: What is 4 + 3?
A) 6
B) 7
C) 8
D) 9
Answer: B
Explanation: 4 + 3 = 7.

Question 3: Which number is the largest?
A) 12
B) 19
C) 15
D) 8
Answer: B
Explanation: 19 is greater than 15, 12, and 8.`,

  scienceGrade5: `Grade 5 Matter & Energy Assessment
Question 1: What state of matter has a fixed volume but takes the shape of its container?
A) Solid
B) Liquid
C) Gas
D) Plasma
Answer: B
Explanation: Liquids have definite volume due to cohesive intermolecular forces, but conform to container boundaries.

Question 2: What is the boiling point of pure water at sea level in Celsius?
A) 50°C
B) 90°C
C) 100°C
D) 120°C
Answer: C
Explanation: Water boils at 100 degrees Celsius (212°F) under 1 atm of atmospheric pressure.

Question 3: Which of the following is a renewable source of energy?
A) Coal
B) Petroleum
C) Solar Radiation
D) Natural Gas
Answer: C
Explanation: Solar energy is replenished naturally by the sun continuously.`
};
