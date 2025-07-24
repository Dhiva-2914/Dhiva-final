import React from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children, style, className }) => {
  return (
    <div
      className={className}
      style={{
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#888 #e0e0e0',
        ...style,
      }}
    >
      {children}
      <style>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-track {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default CustomScrollbar;
