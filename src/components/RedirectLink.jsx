import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Space, Tooltip } from 'antd';
import { CopyOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './RedirectLink.css';

const RedirectLink = ({ link }) => {
  const [copyStatus, setCopyStatus] = useState(false);

  return (
    <Input
      suffix={
        <Space className="redirect-link-suffix">
          <Tooltip placement="top" title={copyStatus ? 'Copied!' : 'copy to clipboard'}>
            <CopyToClipboard text={link} onCopy={() => setCopyStatus(true)}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                aria-label="Copy link to clipboard"
              />
            </CopyToClipboard>
          </Tooltip>
          <Tooltip placement="top" title="open in new tab">
            <Button
              type="text"
              size="small"
              icon={<ArrowRightOutlined />}
              aria-label="Open link in a new tab"
              onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
            />
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
