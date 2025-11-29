export function shouldShowQuestion(rules, answers) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const { logic, conditions } = rules;

  const results = conditions.map(condition => 
    evaluateCondition(condition, answers)
  );

  if (logic === 'AND') {
    return results.every(result => result === true);
  } else if (logic === 'OR') {
    return results.some(result => result === true);
  }

  return true;
}

function evaluateCondition(condition, answers) {
  const { questionKey, operator, value } = condition;
  const answer = answers[questionKey];

  if (answer === undefined || answer === null || answer === '') {
    return false;
  }

  switch (operator) {
    case 'equals':
      return areValuesEqual(answer, value);
    case 'notEquals':
      return !areValuesEqual(answer, value);
    case 'contains':
      return containsValue(answer, value);
    default:
      return false;
  }
}

function areValuesEqual(answer, value) {
  if (Array.isArray(answer)) {
    if (Array.isArray(value)) {
      return JSON.stringify(answer.sort()) === JSON.stringify(value.sort());
    }
    return answer.includes(value);
  }

  if (typeof answer === 'string' && typeof value === 'string') {
    return answer.toLowerCase() === value.toLowerCase();
  }

  return answer === value;
}

function containsValue(answer, value) {
  if (Array.isArray(answer)) {
    return answer.some(item => 
      String(item).toLowerCase().includes(String(value).toLowerCase())
    );
  }

  if (typeof answer === 'string' && typeof value === 'string') {
    return answer.toLowerCase().includes(value.toLowerCase());
  }

  return false;
}