import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { Table, Tag, Tooltip, Input, Row, Col, Button, Popover } from 'antd';
import ProblemsTableControl from './ProblemsTableControl';
import './ProblemsTable.css';

const ProblemsTable = () => {
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [filteredDifficulty, setFilteredDifficulty] = useState([]);

  const [controlPopoverOpen, setControlPopoverOpen] = useState(false);
  const [redirectSite, setRedirectSite] = useState('com');
  const [showPremium, setShowPremium] = useState(true);
  const [showTopics, setShowTopics] = useState(true);

  const likeRateThresholds = useMemo(() => {
    const likeRateSorted = problems.map(problem => problem.likeRate).sort((a, b) => a - b)
    const thresholds = [
      likeRateSorted[Math.floor(likeRateSorted.length / 3 * 1)],
      likeRateSorted[Math.floor(likeRateSorted.length / 3 * 2)],
    ];
    return thresholds;
  }, [problems]);
  const calcLikeRateLevel = useCallback((likeRate) => {
    if (likeRate < likeRateThresholds[0]) {
      return 'low';
    } else if (likeRate < likeRateThresholds[1]) {
      return 'mid';
    } else {
      return 'high';
    }
  }, [likeRateThresholds]);

  const acRateThresholds = useMemo(() => {
    const acRateSorted = problems.map(problem => problem.acRate).sort((a, b) => a - b)
    const thresholds = [
      acRateSorted[Math.floor(acRateSorted.length / 3 * 1)],
      acRateSorted[Math.floor(acRateSorted.length / 3 * 2)],
    ];
    return thresholds;
  }, [problems]);
  const calcAcRateLevel = useCallback((acRate) => {
    if (acRate < acRateThresholds[0]) {
      return 'low';
    } else if (acRate < acRateThresholds[1]) {
      return 'mid';
    } else {
      return 'high';
    }
  }, [acRateThresholds]);

  const [searchIdText, setSearchIdText] = useState('');
  const searchIdInput = useRef(null);
  const handleSearchId = (selectedKeys, confirm) => {
    confirm();
    setSearchIdText(selectedKeys[0]);
  };
  const handleResetSearchId = (clearFilters) => {
    clearFilters();
    setSearchIdText('');
  };

  const [searchTitleText, setSearchTitleText] = useState('');
  const searchTitleInput = useRef(null);
  const handleSearchTitle = (selectedKeys, confirm) => {
    confirm();
    setSearchTitleText(selectedKeys[0]);
  };
  const handleResetSearchTitle = (clearFilters) => {
    clearFilters();
    setSearchTitleText('');
  };

  useEffect(() => {
    setLoadingProblems(true);
    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/info`)
      .then((response) => {
        const newProblems = Object.entries(response.data)
          .map(([_, value]) => value)
          .map(obj => ({
            ...obj, 
            likeRate: obj.likes / Math.max(1, (obj.likes + obj.dislikes)) * 100,
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

  const compareStringArray = (arr1, arr2) => {
    if (typeof(arr1) !== 'string' || typeof(arr2) !== 'string') {
      return false;
    }
    if (arr1.length !== arr2.length) {
      return false;
    }
    const arr1_sorted = [...arr1].sort();
    const arr2_sorted = [...arr2].sort();
    for (let i = 0; i < arr1_sorted.length; i++) {
      if (arr1_sorted[i] !== arr2_sorted[i]) {
        return false;
      }
    }
    return true;
  }

  const handleChange = (_, filters) => {
    if (!compareStringArray(filters.difficulty, filteredDifficulty)) {
      setFilteredDifficulty(filters.difficulty === null ? [] : filters.difficulty);
    }
    if (!compareStringArray(filters.topicTags, filteredTopics)) {
      setFilteredTopics(filters.topicTags === null ? [] : filters.topicTags);
    }
  };

  const problemsToShow = useMemo(() => {
    if (showPremium) {
      return problems;
    }
    return problems.filter(problem => !problem.paidOnly);
  }, [problems, showPremium]);

  return (
    <>
      <h1 className='all-problems-header'>
        <span>All Problems</span>
        <div className='header-settings'>
          <ProblemsTableControl
            direction="horizontal"
            showPremium={showPremium}
            setShowPremium={setShowPremium}
            showTopics={showTopics}
            setShowTopics={setShowTopics}
            redirectSite={redirectSite}
            setRedirectSite={setRedirectSite}
          />
        </div>
        <div className='header-settings-with-popover'>
          <Popover
            content={<ProblemsTableControl
              direction="vertical"
              showPremium={showPremium}
              setShowPremium={setShowPremium}
              showTopics={showTopics}
              setShowTopics={setShowTopics}
              redirectSite={redirectSite}
              setRedirectSite={setRedirectSite}
            />}
            trigger="click"
            placement="bottomRight"
            open={controlPopoverOpen}
            onOpenChange={setControlPopoverOpen}
          >
            <Button icon={<SettingOutlined />}>Settings</Button>
          </Popover>
        </div>
      </h1>
      <Table 
        dataSource={problemsToShow} 
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
          width={84}
          fixed="left"
          sorter={(a, b) => Number(a.frontendQuestionId) - Number(b.frontendQuestionId)}
          filteredValue={searchIdText ? [searchIdText] : []}
          filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div
              className='search-id-dropdown' 
              onKeyDown={(e) => e.stopPropagation()} 
            >
              <Input
                ref={searchIdInput}
                placeholder="Search id"
                value={selectedKeys[0]}
                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => handleSearchId(selectedKeys, confirm)}
              />
              <Row gutter={8}>
                <Col span={12}>
                  <Button
                    onClick={() => clearFilters && handleResetSearchId(clearFilters)}
                    size="small"
                    block
                  >
                    Reset
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    onClick={() => handleSearchId(selectedKeys, confirm)}
                    icon={<SearchOutlined />}
                    size="small"
                  >
                    Search
                  </Button>
                </Col>
              </Row>
            </div>
          )}
          filterIcon={(filtered) => (
            <SearchOutlined
              style={{
                color: filtered ? '#1890ff' : undefined,
              }}
            />
          )}
          onFilter={(value, record) => record.frontendQuestionId.toString().includes(value.toString())}
          onFilterDropdownOpenChange={(visible) => {
            if (visible) {
              setTimeout(() => searchIdInput.current?.select(), 100);
            }
          }}
        />
        <Table.Column 
          title="Title"
          key="title" 
          filteredValue={searchTitleText ? [searchTitleText] : []}
          filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div
              className='search-title-dropdown' 
              onKeyDown={(e) => e.stopPropagation()} 
            >
              <Input
                ref={searchTitleInput}
                placeholder="Search title"
                value={selectedKeys[0]}
                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => handleSearchTitle(selectedKeys, confirm)}
              />
              <Row gutter={8}>
                <Col span={12}>
                  <Button
                    onClick={() => clearFilters && handleResetSearchTitle(clearFilters)}
                    size="small"
                    block
                  >
                    Reset
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    onClick={() => handleSearchTitle(selectedKeys, confirm)}
                    icon={<SearchOutlined />}
                    size="small"
                  >
                    Search
                  </Button>
                </Col>
              </Row>
            </div>
          )}
          filterIcon={(filtered) => (
            <SearchOutlined
              style={{
                color: filtered ? '#1890ff' : undefined,
              }}
            />
          )}
          onFilter={(value, record) => record.title.toLowerCase().includes(value.toLowerCase())}
          onFilterDropdownOpenChange={(visible) => {
            if (visible) {
              setTimeout(() => searchTitleInput.current?.select(), 100);
            }
          }}
          render={(problem) => {
            const { title, titleSlug, paidOnly } = problem;
            return (
              <span className="title">
                <a 
                  href={`https://www.leetcode.${redirectSite}/problems/${titleSlug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  title={`go to problem page of ${titleSlug}`}
                >{title}</a>
                {paidOnly && <Tag className='premium-tag' color="gold">Premium</Tag>}
              </span>
            );
          }}
        />
        <Table.Column 
          title="Like Rate" 
          key="likeRate" 
          width={108}
          sorter={(a, b) => b.likeRate - a.likeRate}
          render={(problem) => {
            const { likes, dislikes, likeRate } = problem;
            return (
              <Tooltip 
                placement="top" 
                title={
                  <div className="like-rate-tooltip">
                    <div>likes:</div>
                    <div className="tooltip-value">{likes.toLocaleString()}</div>
                    <div>dislikes:</div>
                    <div className="tooltip-value">{dislikes.toLocaleString()}</div>
                  </div>
                }
              >
                <span className={`ac-rate-${calcLikeRateLevel(likeRate)}`}>{`${Math.round(likeRate * 100) / 100}%`}</span>
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
                  <div className="ac-rate-tooltip">
                    <div>accepted:</div>
                    <div className="tooltip-value">{totalSubmissionRaw.toLocaleString()}</div>
                    <div>submitted:</div>
                    <div className="tooltip-value">{totalAcceptedRaw.toLocaleString()}</div>
                  </div>
                }
              >
                <span className={`ac-rate-${calcAcRateLevel(acRate)}`}>{`${Math.round(acRate * 100) / 100}%`}</span>
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
          filteredValue={filteredDifficulty}
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
                  showTopics ? topicTags.map(
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
                  ) : <span className="topics-hidden">Topics hidden as requested</span>
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
