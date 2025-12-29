import React from 'react';
import { FiEye, FiAward } from 'react-icons/fi';

const AnswersReveal = ({ currentLetter, categories, allAnswers, players }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-xl">
                <FiEye size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Round Results</h1>
                <p className="text-gray-600">Letter: {currentLetter}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Discuss & Review</p>
              <p className="text-lg font-semibold text-gray-800">
                {players.length} Players
              </p>
            </div>
          </div>
        </div>

        {/* Answers Grid */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-bold sticky left-0 bg-gray-800 z-10">
                    Category
                  </th>
                  {players.map((player) => (
                    <th
                      key={player.id}
                      className="px-6 py-4 text-center text-white font-bold min-w-[200px]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{player.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category, idx) => (
                  <tr
                    key={category.id}
                    className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800 sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {category.label.charAt(0)}
                        </div>
                        {category.label}
                      </div>
                    </td>
                    {players.map((player) => {
                      const answer = allAnswers[player.id]?.[category.id];
                      const hasAnswer = answer && answer.trim() !== '';
                      const startsWithLetter =
                        hasAnswer && answer.toUpperCase().startsWith(currentLetter);

                      // Count how many players gave the same answer (case-insensitive)
                      const duplicateCount = hasAnswer
                        ? players.filter(
                            (p) =>
                              allAnswers[p.id]?.[category.id]?.toLowerCase().trim() ===
                              answer.toLowerCase().trim()
                          ).length
                        : 0;

                      const isUnique = duplicateCount === 1;
                      const isDuplicate = duplicateCount > 1;

                      return (
                        <td key={player.id} className="px-6 py-4 text-center">
                          {hasAnswer ? (
                            <div className="space-y-2">
                              <div
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  !startsWithLetter
                                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                                    : isUnique
                                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                    : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                                }`}
                              >
                                {answer}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No answer</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            💬 Discussion Time
          </h3>
          <p className="text-blue-800 text-sm">
            Take a moment to discuss answers with other players. Are all answers valid?
            Any creative or surprising choices? Scores will be calculated automatically...
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-6 bg-gray-100 border-2 border-gray-300 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            <p className="text-gray-700 font-semibold">Calculating scores...</p>
          </div>
          <p className="text-gray-600 text-sm">
            Analyzing answers and determining points
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnswersReveal;
