import React from 'react';
import { Check } from 'lucide-react';

export default function StepProgress({ currentStep, steps }) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <React.Fragment key={stepNum}>
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-iem-blue-800 text-white ring-4 ring-iem-blue-200'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-iem-blue-800'
                      : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      stepNum < currentStep ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
