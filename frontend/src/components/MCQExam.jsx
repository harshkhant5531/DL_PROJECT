import React, { useState } from "react";

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: "What does HTML stand for?",
    options: [
      "Hyperlinks and Text Markup Language",
      "HyperText Markup Language",
      "Home Tool Markup Language",
      "HyperText Markdown Language",
    ],
    answerIndex: 1,
  },
  {
    id: 2,
    question: "Which tag is used to create a link in HTML?",
    options: ["<link>", "<a>", "<href>", "<url>"],
    answerIndex: 1,
  },
  {
    id: 3,
    question: "Which of these is NOT a JavaScript data type?",
    options: ["String", "Boolean", "Float", "Undefined"],
    answerIndex: 2,
  },
];

const MCQExam = ({ questions = DEFAULT_QUESTIONS, onFinish }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const question = questions[current];

  const handleSelect = (index) => {
    if (submitted) return;
    setSelected(index);
  };

  const handleSubmit = () => {
    if (selected === null) return;

    const isCorrect = selected === question.answerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setSubmitted(true);
  };

  const handleNext = () => {
    const nextIndex = current + 1;
    if (nextIndex >= questions.length) {
      onFinish({ score, total: questions.length });
      return;
    }
    setCurrent(nextIndex);
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <div className="bg-white p-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200">
      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-4">Exam Module</h2>
      <div className="text-sm text-gray-500 mb-3">
        Question {current + 1} of {questions.length}
      </div>
      <div className="text-base font-medium text-gray-800 mb-4">
        {question.question}
      </div>

      <div className="space-y-3">
        {question.options.map((opt, idx) => {
          const isSelected = idx === selected;
          const isCorrect = submitted && idx === question.answerIndex;
          const isWrong =
            submitted && isSelected && idx !== question.answerIndex;

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all shadow-sm ${
                isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : isWrong
                    ? "border-rose-500 bg-rose-50 text-rose-900"
                    : isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Score: <span className="font-semibold text-gray-800">{score}</span>
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-full bg-green-600 text-white font-medium"
          >
            {current + 1 === questions.length ? "Finish" : "Next"}
          </button>
        )}
      </div>

      {submitted && (
        <div className="mt-4 text-sm font-medium text-gray-700">
          {selected === question.answerIndex ? (
            <span className="text-emerald-600">Correct! ✅</span>
          ) : (
            <span className="text-rose-600">
              Incorrect. The correct answer is "
              {question.options[question.answerIndex]}".
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MCQExam;
