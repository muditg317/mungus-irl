import React from 'react';

import { upperFirstCharOnly } from 'utils';

const parseRuleValue = (rule) => {
  switch (rule.type) {
    case 'NUMERIC':
      return rule.value;
    case 'TOGGLE':
      return rule.value ? 'On' : 'Off';
    case 'ENUM':
      return rule.value;
    default:
      return rule.value;
  }
}

export default function RuleInput(props) {
  const { ruleName, rule, updateRule } = props;
  // console.log(rule);
  switch (rule.type) {
    case 'NUMERIC':
      return (
        <div className="flex flex-row items-center">
          <button className="p-2 pt-0.5 pb-1 border border-white rounded-lg" onClick={() => updateRule(ruleName, rule.value, rule.value - rule.increment >= rule.min ? rule.value - rule.increment : rule.value)}><i className="inline-block border-white border-b-4 border-r-4 p-1 transform rotate-45"></i></button>
          <p className="mx-1 text-lg font-semibold">{rule.value}</p>
          <button className="p-2 pb-0.5 pt-1 border border-white rounded-lg" onClick={() => updateRule(ruleName, rule.value, rule.value + rule.increment <= rule.max ? rule.value + rule.increment : rule.value)}><i className="inline-block border-white border-b-4 border-r-4 p-1 transform -rotate-135"></i></button>
        </div>
      );
    case 'TOGGLE':
      return (
        <button className={`rounded-full w-9 h-5 bg-${rule.value ? 'green' : 'gray'}-500 flex flex-col items-${rule.value ? 'end' : 'start'}`} onClick={() => updateRule(ruleName, rule.value, !rule.value)}>
          <div className={`rounded-full w-5 h-5 bg-white`}></div>
        </button>
      );
    case 'ENUM':
      return (
        <button className="bg-gray-500 rounded-md px-1 py-0.5" onClick={() => updateRule(ruleName, rule.value, rule.options[(rule.options.indexOf(rule.value) + 1) % rule.options.length])}>
          { upperFirstCharOnly(rule.value) }
        </button>
      );
    default:
      return (
        <input type="text" onChange={(event) => updateRule(ruleName, rule.value, event.target.value)} className="border border-white rounded-md text-red-500 p-0.5" value={parseRuleValue(rule)} />
      );
  }
}
