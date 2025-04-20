import React from 'react';
import { Tooltip, Switch, Space } from 'antd';

const ProblemsTableControl = ({
  direction,
  showPremium,
  setShowPremium,
  showTopics,
  setShowTopics,
  redirectSite,
  setRedirectSite,
}) => {
  return (
    <Space direction={direction}>
      <Tooltip
        placement="top"
        title="Toggle to show/hide problem topics"
      >
        <Switch
          checked={showTopics}
          checkedChildren="Show Topics" 
          unCheckedChildren="Hide Topics" 
          onChange={(checked) => setShowTopics(checked)} 
        />
      </Tooltip>
      <Tooltip
        placement="top"
        title="Toggle to show/hide premium problems"
      >
        <Switch
          checked={showPremium}
          checkedChildren="Show Premium" 
          unCheckedChildren="Hide Premium" 
          onChange={(checked) => setShowPremium(checked)} 
        />
      </Tooltip>
      <Tooltip
        placement="top"
        title={`Click problem title to redirect to leetcode ${redirectSite === 'cn' ? 'China' : 'global'} site`}
      >
        <Switch
          checked={redirectSite === 'com'}
          checkedChildren="Global site" 
          unCheckedChildren="China site" 
          onChange={(checked) => setRedirectSite(checked ? 'com' : 'cn')} 
        />
      </Tooltip>
    </Space>
  )
};

export default ProblemsTableControl;