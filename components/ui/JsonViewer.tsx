'use client';

import * as React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
  expandDepth?: number;
}

type JsonNode = {
  key?: string;
  value: unknown;
  depth: number;
  isLast: boolean;
};

export function JsonViewer({ data, expandDepth = 2 }: JsonViewerProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());

  // Initialize expanded nodes based on expandDepth
  React.useEffect(() => {
    const nodes = new Set<string>();
    const collectExpandableNodes = (obj: unknown, path: string = '', depth: number = 0) => {
      // Check if this node should be expanded
      const shouldExpand = expandDepth === Infinity || depth < expandDepth;
      if (shouldExpand && (typeof obj === 'object' && obj !== null)) {
        nodes.add(path);
        Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
          collectExpandableNodes(value, `${path}.${key}`, depth + 1);
        });
      }
    };
    collectExpandableNodes(data, 'root');
    setExpandedNodes(nodes);
  }, [data, expandDepth]);

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const isExpandable = (value: unknown): boolean => {
    return typeof value === 'object' && value !== null;
  };

  const renderValue = (node: JsonNode, path: string): React.ReactNode => {
    const { key, value, depth, isLast } = node;
    const isExpanded = expandedNodes.has(path);
    const canExpand = isExpandable(value);
    const indent = depth * 16;

    if (value === null) {
      return (
        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
          {key && <span className="text-blue-600 mr-2">"{key}"</span>}
          <span className="text-red-600">null</span>
          {!isLast && <span className="text-gray-400 ml-1">,</span>}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
          {key && <span className="text-blue-600 mr-2">"{key}"</span>}
          <span className="text-purple-600">{String(value)}</span>
          {!isLast && <span className="text-gray-400 ml-1">,</span>}
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
          {key && <span className="text-blue-600 mr-2">"{key}"</span>}
          <span className="text-orange-600">{String(value)}</span>
          {!isLast && <span className="text-gray-400 ml-1">,</span>}
        </div>
      );
    }

    if (typeof value === 'string') {
      return (
        <div className="flex items-baseline" style={{ paddingLeft: `${indent}px` }}>
          {key && <span className="text-blue-600 mr-2">"{key}"</span>}
          <span className="text-green-600 break-all">"{value}"</span>
          {!isLast && <span className="text-gray-400 ml-1">,</span>}
        </div>
      );
    }

    if (Array.isArray(value)) {
      const isEmpty = value.length === 0;
      const bracketColor = 'text-gray-700';

      if (isEmpty) {
        return (
          <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
            {key && <span className="text-blue-600 mr-2">"{key}"</span>}
            <span className={bracketColor}>[]</span>
            {!isLast && <span className="text-gray-400 ml-1">,</span>}
          </div>
        );
      }

      return (
        <div>
          <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
            {key && <span className="text-blue-600 mr-2">"{key}"</span>}
            <button
              onClick={() => toggleNode(path)}
              className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            <span className={bracketColor}>[</span>
            {!isExpanded && <span className={bracketColor}>]</span>}
            {!isExpanded && !isLast && <span className="text-gray-400 ml-1">,</span>}
            {!isExpanded && (
              <span className="text-gray-500 ml-2">
                {value.length} item{value.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {isExpanded && (
            <div>
              {value.map((item, index) => (
                <div key={index}>
                  {renderValue(
                    {
                      value: item,
                      depth: depth + 1,
                      isLast: index === value.length - 1,
                    },
                    `${path}[${index}]`
                  )}
                </div>
              ))}
              <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
                <span className={bracketColor}>]</span>
                {!isLast && <span className="text-gray-400 ml-1">,</span>}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Object
    const entries = Object.entries(value as Record<string, unknown>);
    const isEmpty = entries.length === 0;
    const bracketColor = 'text-gray-700';

    if (isEmpty) {
      return (
        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
          {key && <span className="text-blue-600 mr-2">"{key}"</span>}
          <span className={bracketColor}>{'{}'}</span>
          {!isLast && <span className="text-gray-400 ml-1">,</span>}
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
          {key && <span className="text-blue-600 mr-2">"{key}"</span>}
          <button
            onClick={() => toggleNode(path)}
            className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <span className={bracketColor}>{'{'}</span>
          {!isExpanded && <span className={bracketColor}>{'}'}</span>}
          {!isExpanded && !isLast && <span className="text-gray-400 ml-1">,</span>}
          {!isExpanded && (
            <span className="text-gray-500 ml-2">
              {entries.length} propert{entries.length !== 1 ? 'ies' : 'y'}
            </span>
          )}
        </div>
        {isExpanded && (
          <div>
            {entries.map(([k, v], index) => (
              <div key={k}>
                {renderValue(
                  {
                    key: k,
                    value: v,
                    depth: depth + 1,
                    isLast: index === entries.length - 1,
                  },
                  `${path}.${k}`
                )}
              </div>
            ))}
            <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
              <span className={bracketColor}>{'}'}</span>
              {!isLast && <span className="text-gray-400 ml-1">,</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="font-mono text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-x-auto">
      {renderValue({ value: data, depth: 0, isLast: true }, 'root')}
    </div>
  );
}

export default JsonViewer;
