import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeGraph } from '../hooks/useTagCloud';
import { KnowledgeGraphNode, KnowledgeGraphEdge } from '@amb/types';

function SimpleGraphView({
  nodes,
  edges,
}: {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}) {
  // Simple list-based graph visualization
  // For production, replace with D3.js or vis-network
  const nodeMap = useMemo(() => {
    const map = new Map<string, KnowledgeGraphNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const connectionMap = useMemo(() => {
    const map = new Map<string, { target: string; type: string }[]>();
    edges.forEach((e) => {
      const existing = map.get(e.source) || [];
      existing.push({ target: e.target, type: e.type });
      map.set(e.source, existing);
    });
    return map;
  }, [edges]);

  const levelGroups = useMemo(() => {
    const groups = new Map<number, KnowledgeGraphNode[]>();
    nodes.forEach((n) => {
      const existing = groups.get(n.level) || [];
      existing.push(n);
      groups.set(n.level, existing);
    });
    return groups;
  }, [nodes]);

  const levelLabels: Record<number, string> = {
    1: 'Domain',
    2: 'Topic',
    3: 'Context',
  };

  return (
    <div className="space-y-6">
      {[1, 2, 3].map((level) => {
        const levelNodes = levelGroups.get(level) || [];
        if (levelNodes.length === 0) return null;

        return (
          <div key={level}>
            <h3 className="mb-2 text-sm font-semibold text-gray-500">
              {levelLabels[level]} ({levelNodes.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {levelNodes.map((node) => {
                const connections = connectionMap.get(node.id) || [];
                return (
                  <div
                    key={node.id}
                    className="group relative rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div
                      className="font-medium"
                      style={{ color: node.color || '#374151', fontSize: `${Math.max(0.8, Math.min(1.2, node.weight / 10))}rem` }}
                    >
                      {node.name}
                    </div>
                    <div className="text-xs text-gray-400">{node.weight} uses</div>
                    {connections.length > 0 && (
                      <div className="absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-md border border-gray-200 bg-white p-2 shadow-lg group-hover:block">
                        <div className="text-[10px] font-semibold text-gray-400">Connected to:</div>
                        {connections.slice(0, 5).map((conn, i) => {
                          const targetNode = nodeMap.get(conn.target);
                          return (
                            <div key={i} className="text-xs text-gray-600">
                              {targetNode?.name || conn.target}
                              <span className="ml-1 text-gray-400">({conn.type})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function KnowledgeGraphPage() {
  const { t } = useTranslation('kms');
  const { data: graphData, isLoading } = useKnowledgeGraph({ minUsage: 1, maxNodes: 100 });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('graph.title')}</h2>
          {graphData && (
            <p className="text-sm text-gray-500">
              {graphData.nodes.length} {t('graph.nodes')} · {graphData.edges.length} {t('graph.edges')}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <SimpleGraphView nodes={graphData.nodes} edges={graphData.edges} />
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            {t('tag.noTags')}
          </div>
        )}
      </div>
    </div>
  );
}
