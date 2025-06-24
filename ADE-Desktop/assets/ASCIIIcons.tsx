import React from 'react';

interface ASCIIIconProps {
  className?: string;
}

export const FileIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>□</span>
);

export const FolderIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>▣</span>
);

export const FolderOpenIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>▢</span>
);

export const TerminalIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>▶</span>
);

export const ChatIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>◇</span>
);

export const CloseIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>×</span>
);

export const MenuIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>≡</span>
);

export const ArrowIcon: React.FC<ASCIIIconProps & { direction: 'left' | 'right' | 'up' | 'down' }> = ({ 
  direction, 
  className = "" 
}) => {
  const arrows = {
    left: '◀',
    right: '▶',
    up: '▲',
    down: '▼'
  };
  
  return <span className={`font-mono text-white ${className}`}>{arrows[direction]}</span>;
};

export const WorkflowIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>◈</span>
);

export const CanvasIcon: React.FC<ASCIIIconProps> = ({ className = "" }) => (
  <span className={`font-mono text-white ${className}`}>⟐</span>
);