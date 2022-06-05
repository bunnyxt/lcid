import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';
import './RedirectCard.css';
import RedirectLink from './RedirectLink';

const RedirectCard = () => {
  const [problemId, setProblemId] = useState(146);
  const redirectIdInputRef = useRef(null);

  useEffect(() => {
    // initialize problem id
    setProblemId(Math.ceil(Math.random() * 300));
    // set id inpurt focus
    redirectIdInputRef.current.focus({ cursor: 'end' });
  }, []);

  return (
    <div className="redirect-card">
      <h1><span className="color-l">L</span><span className="color-c">C</span><span className="color-id">id</span> - access <span className="color-l">L</span>eet<span className="color-c">C</span>ode problems via <span className="color-id">id</span></h1>
      <div>
        Known LeetCode problem id, but don&apos;t know how to get there?<br />
        Just visit <code>lcid.cc/&lt;problem-id&gt;</code>, <br />
        then the browser will redirect you to the problem page.
      </div>
      <Input
        className="redirect-id-input"
        addonBefore="LeetCode problem id"
        value={problemId}
        onChange={(e) => setProblemId(e.target.value)}
        ref={redirectIdInputRef}
      />
      <div className="redirect-link-grid">
        <div className="redirect-link-label">
          redirect to problem page (global)
        </div>
        <RedirectLink link={`https://lcid.cc/${problemId}`} />
        <div className="redirect-link-label">
          redirect to problem page (China)
        </div>
        <RedirectLink link={`https://lcid.cc/cn/${problemId}`} />
        <div className="redirect-link-label">
          redirect to problem public info
        </div>
        <RedirectLink link={`https://lcid.cc/info/${problemId}`} />
      </div>
      <div className="redirect-footer">
        <div>Note: Problems info is not up-to-date. It updates once a day.</div>
        <div>by. <a href="https://github.com/bunnyxt" target="_blank" rel="noreferrer">bunnyxt</a>, view more at <a href="https://github.com/bunnyxt/lcid" target="_blank" rel="noreferrer">GitHub</a></div>
      </div>
    </div>
  );
};

export default RedirectCard;
