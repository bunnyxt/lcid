import React from 'react';
import { App as AntApp } from 'antd';
import './App.css';
import RedirectCard from './components/RedirectCard';
import ProblemsTable from './components/ProblemsTable';

const App = () => {
  return (
    <AntApp>
      <div className="App">
        <div className="redirect-wrapper">
          <RedirectCard />
        </div>
        <div className="problems-table-wrapper">
          <ProblemsTable />
        </div>
      </div>
    </AntApp>
  );
};

export default App;
