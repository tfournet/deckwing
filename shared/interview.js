import interviewQuestions from '../src/config/design/interview-questions.json' with { type: 'json' };

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function stringifyAnswer(answer) {
  if (answer == null) {
    return '';
  }

  if (typeof answer === 'string') {
    return answer.trim();
  }

  if (Array.isArray(answer)) {
    return answer.map(stringifyAnswer).filter(Boolean).join(', ');
  }

  if (typeof answer === 'object') {
    return answer.label ?? answer.value ?? answer.text ?? Object.values(answer).map(stringifyAnswer).filter(Boolean).join(', ');
  }

  return String(answer);
}

export function getInterviewConfig() {
  return interviewQuestions;
}

export function shouldSkipInterview(userMessage) {
  const normalizedMessage = normalizeText(userMessage);
  if (!normalizedMessage) {
    return false;
  }

  return (interviewQuestions.skipPhrases ?? []).some(phrase => normalizedMessage.includes(normalizeText(phrase)));
}

export function formatInterviewContext(answers = {}) {
  const lines = (interviewQuestions.questions ?? [])
    .map(question => {
      const value = stringifyAnswer(answers[question.id]);
      return value ? `- ${question.text} ${value}` : null;
    })
    .filter(Boolean);

  return lines.length > 0
    ? ['Interview context:', ...lines].join('\n')
    : 'Interview context: none provided';
}

export default {
  getInterviewConfig,
  shouldSkipInterview,
  formatInterviewContext,
};
