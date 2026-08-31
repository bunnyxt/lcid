import React, { lazy, Suspense } from 'react';
import { App as AntApp, Spin } from 'antd';
import './App.css';
import RedirectCard from './components/RedirectCard';

const ProblemsTable = lazy(() => import('./components/ProblemsTable'));

const App = () => {
  return (
    <AntApp>
      <div className="App">
        <div className="redirect-wrapper">
          <RedirectCard />
        </div>
        <div className="problems-table-wrapper">
          <Suspense fallback={<div className="problems-table-fallback"><Spin size="large" /></div>}>
            <ProblemsTable />
          </Suspense>
        </div>
      </div>
    </AntApp>
  );
};

export default App;
