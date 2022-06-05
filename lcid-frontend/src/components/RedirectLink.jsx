import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Input, Space, Tooltip } from 'antd';
import { CopyOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './RedirectLink.css';

const RedirectLink = ({ link }) => {
  const [copyStatus, setCopyStatus] = useState(false);

  return (
    <Input
      suffix={
        <Space className="redirect-link-suffix">
          <Tooltip placement="top" title={copyStatus ? 'Copyed!' : 'copy to clipboard'}>
            <CopyToClipboard text={link} onCopy={() => setCopyStatus(true)}>
              <CopyOutlined />
            </CopyToClipboard>
          </Tooltip>
          <Tooltip placement="top" title="open in new tab">
            <ArrowRightOutlined onClick={() => window.open(link)} />
          </Tooltip>
        </Space>
      }
      value={link}
    />
  );
};

RedirectLink.propTypes = {
  link: PropTypes.string.isRequired
};

export default RedirectLink;
