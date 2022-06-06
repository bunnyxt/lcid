import React from 'react';
import './App.css';
import RedirectCard from './components/RedirectCard';
import ProblemsTable from './components/ProblemsTable';

const App = () => {
  return (
    <div className="App">
      <div className="redirect-wrapper">
        <RedirectCard />
      </div>
      <div className="problems-table-wrapper">
        <ProblemsTable />
      </div>
    </div>
  );
};

export default App;
