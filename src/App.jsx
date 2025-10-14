import React from 'react';
import { Link } from 'react-router-dom';

const App = () => {
  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      <button
        onClick={() => window.location.href = '/voice'}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg hover:scale-105 transition-transform font-bold text-lg"
      >
        🎤 Voice Agent
      </button>
      <button
        onClick={() => window.location.href = '/chat'}
        className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg shadow-lg hover:scale-105 transition-transform font-bold text-lg"
      >
        💬 Chat Channel
      </button>
    </div>
  );
};

export default App;