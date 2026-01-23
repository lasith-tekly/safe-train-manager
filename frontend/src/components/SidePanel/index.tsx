import React from 'react';
import { Drawer } from 'antd';

interface SidePanelProps {
  visible: boolean;
  title: string;
  width?: number;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  visible,
  title,
  width = 480,
  onClose,
  footer,
  children,
}) => {
  return (
    <Drawer
      title={title}
      placement="right"
      width={width}
      onClose={onClose}
      open={visible}
      footer={footer}
      footerStyle={{
        textAlign: 'right',
        paddingTop: 16,
        borderTop: '1px solid #d9d9d9',
      }}
    >
      {children}
    </Drawer>
  );
};
