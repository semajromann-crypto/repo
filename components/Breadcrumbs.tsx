/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface BreadcrumbsProps {
  history: string[];
  onBreadcrumbClick: (topic: string, index: number) => void;
  isLoading: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ history, onBreadcrumbClick, isLoading }) => {
  if (history.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      id="breadcrumb-nav"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        color: '#888',
        flexWrap: 'wrap',
        borderBottom: '1px solid #eee',
        paddingBottom: '0.75rem',
      }}
    >
      <span 
        id="breadcrumb-label"
        style={{ 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          color: '#bbb', 
          fontSize: '0.8rem',
          marginRight: '0.25rem',
          userSelect: 'none'
        }}
      >
        History
      </span>
      {history.map((topic, index) => {
        const isLast = index === history.length - 1;
        const itemId = `breadcrumb-item-${index}`;

        return (
          <React.Fragment key={`${topic}-${index}`}>
            {index > 0 && (
              <span style={{ color: '#ccc', userSelect: 'none' }} aria-hidden="true">
                /
              </span>
            )}
            {isLast ? (
              <span 
                id={itemId}
                style={{ 
                  color: '#000000', 
                  fontWeight: 'normal', 
                  textTransform: 'capitalize' 
                }}
                aria-current="page"
              >
                {topic}
              </span>
            ) : (
              <button
                id={itemId}
                onClick={() => !isLoading && onBreadcrumbClick(topic, index)}
                disabled={isLoading}
                style={{
                  color: '#888',
                  textTransform: 'capitalize',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease-in-out',
                }}
                className="interactive-word"
                aria-label={`Navigate back to ${topic}`}
              >
                {topic}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
