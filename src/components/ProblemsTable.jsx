import React, { useState, useEffect} from 'react';
import axios from 'axios';
import { Table, Tag, Tooltip, Switch } from 'antd';
import './ProblemsTable.css';

const ProblemsTable = () => {
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [filtededDifficulty, setFilteredDifficulty] = useState([]);
  const [redirectSite, setRedirectSite] = useState('global');

  useEffect(() => {
    setLoadingProblems(true);
    axios.get('http://localhost:1437/info')
      .then((response) => {
        const newProblems = Object.entries(response.data)
          .map(([_, value]) => value)
          .map(obj => ({
            ...obj, 
            popularity: obj.likes / Math.max(1, (obj.likes + obj.dislikes)) * 100,
          }))
          .sort((a, b) => Number(a.frontendQuestionId) - Number(b.frontendQuestionId));
        setProblems(newProblems);
        const topicsObj = {};
        const topicsCounter = {};
        newProblems.forEach(problem => {
          problem.topicTags.forEach(topic => {
            topicsObj[topic.id] = topic;
            topicsCounter[topic.id] = topicsCounter[topic.id] === undefined ? 1 : topicsCounter[topic.id] + 1
          });
        });
        setTopics(
          Object.entries(topicsObj)
            .map(([key, value]) => ({
              ...value, 
              count: topicsCounter[key],
            }))
            .sort((a, b) => b.count - a.count)
        );
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoadingProblems(false);
      })
  }, []);

  const handleChange = (_, filters) => {
    setFilteredDifficulty(filters.difficulty);
    setFilteredTopics(filters.topicTags);
  };

  return (
    <>
      <h1>All Problems</h1>
      <Table 
        dataSource={problems} 
        rowKey="frontendQuestionId" 
        loading={loadingProblems}
        onChange={handleChange}
        scroll={{ x: 800 }}
        pagination={{ responsive: true }}
      >
        <Table.Column
          title="Id" 
          dataIndex="frontendQuestionId" 
          key="frontendQuestionId" 
          width={72}
          fixed="left"
          sorter={(a, b) => Number(a.frontendQuestionId) - Number(b.frontendQuestionId)}
        />
        <Table.Column 
          title={
            <div className="title-header">
              <span className="title-header-content">Title</span>
              <Tooltip placement="top" title="redirect site">
                <Switch 
                  checkedChildren="China" 
                  unCheckedChildren="global" 
                  onChange={(checked) => setRedirectSite(checked ? 'cn' : 'com')} 
                />
              </Tooltip>
            </div>
          } 
          key="title" 
          render={(problem) => {
            const { title, titleSlug } = problem;
            return (
              <span className="title">
                <a 
                  href={`https://www.leetcode.${redirectSite}/problems/${titleSlug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  title={`go to problem page of ${titleSlug}`}
                >{title}</a>
              </span>
            );
          }}
        />
        <Table.Column 
          title="Popularity" 
          key="popularity" 
          width={108}
          sorter={(a, b) => b.popularity - a.popularity}
          render={(problem) => {
            const { likes, dislikes, popularity } = problem;
            return (
              <Tooltip 
                placement="top" 
                title={
                  <div>
                    {`likes: ${likes.toLocaleString()}`}<br />
                    {`dislikes: ${dislikes.toLocaleString()}`}
                  </div>
                }
              >
                {`${Math.round(popularity * 100) / 100}%`}
              </Tooltip>
            );
          }} 
        />
        <Table.Column 
          title="AC Rate" 
          key="acRate" 
          width={108}
          sorter={(a, b) => b.acRate - a.acRate}
          render={(problem) => {
            const { acRate, totalSubmissionRaw, totalAcceptedRaw } = problem;
            return (
              <Tooltip 
                placement="top" 
                title={
                  <div>
                    {`accepted: ${totalSubmissionRaw.toLocaleString()}`}<br />
                    {`submitted: ${totalAcceptedRaw.toLocaleString()}`}
                  </div>
                }
              >
                {`${Math.round(acRate * 100) / 100}%`}
              </Tooltip>
            );
          }} 
        />
        <Table.Column 
          title="Difficulty" 
          key="difficulty" 
          width={108}
          filters={[
            { text: 'Easy', value: 'Easy'}, 
            { text: 'Medium', value: 'Medium'}, 
            { text: 'Hard', value: 'Hard'}, 
          ]}
          onFilter={(value, record) => record.difficulty === value}
          filteredValue={filtededDifficulty}
          render={(problem) => {
            const { difficulty } = problem;
            return <span className={`difficulty-${difficulty.toLowerCase()}`}>{difficulty}</span>;
          }} 
        />
        <Table.Column 
          title="Topics" 
          key="topicTags" 
          filters={topics.map(topic => ({
            text: `${topic.name} (${topic.count})`,
            value: topic.id,
          }))}
          onFilter={(value, record) => record.topicTags.filter(topic => topic.id === value).length > 0}
          filteredValue={filteredTopics}
          render={(problem) => {
            const { topicTags } = problem;
            return (
              <div className="topics-container">
                {
                  topicTags.map(
                    topic => {
                      const included = filteredTopics.includes(topic.id);
                      return (
                        <Tag 
                          className="topic-tag" 
                          key={topic.id} 
                          title={`${included ? 'remove' : 'add'} topic ${topic.name} ${included ? 'from' : 'to'} filter`}
                          color={included ? 'blue' : null}
                          onClick={() => {
                            if (included) {
                              setFilteredTopics(filteredTopics.filter(topicId => topicId !== topic.id))
                            } else {
                              setFilteredTopics([...filteredTopics, topic.id])
                            }
                          }}
                        >{topic.name}</Tag>
                      );
                    }
                  )
                }
              </div>
            );
          }} 
        />
      </Table>
    </>
  );
};

export default ProblemsTable;
