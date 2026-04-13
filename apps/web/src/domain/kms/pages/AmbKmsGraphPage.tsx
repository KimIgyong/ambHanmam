import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Filter } from 'lucide-react';
import { ambGraphService, AmbGraphData } from '../service/amb-graph.service';

const ForceGraph2D = lazy(() => import('react-force-graph-2d'));

const TYPE_COLORS: Record<string, string> = {
  PROJECT: '#22c55e',
  ISSUE: '#ef4444',
  TODO: '#8b5cf6',
  NOTE: '#6366f1',
  EPIC: '#f59e0b',
  COMPONENT: '#06b6d4',
};

const TYPE_LABELS: Record<string, string> = {
  PROJECT: 'Project',
  ISSUE: 'Issue',
  TODO: 'Todo',
  NOTE: 'Note',
  EPIC: 'Epic',
  COMPONENT: 'Component',
};

interface GraphNode {
  id: string;
  type: string;
  label: string;
  color?: string;
  size?: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
}

export default function AmbKmsGraphPage() {
  const { t } = useTranslation(['kms', 'common']);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [scope, setScope] = useState<'MY' | 'ENTITY'>('MY');
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(['PROJECT', 'ISSUE', 'TODO', 'NOTE', 'EPIC', 'COMPONENT']),
  );
  const [showFilters, setShowFilters] = useState(false);

  // Container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Fetch graph data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ambGraphService
      .getGraphData({ scope })
      .then((data: AmbGraphData) => {
        if (cancelled) return;
        const linkCount: Record<string, number> = {};
        data.edges.forEach((e) => {
          linkCount[e.source] = (linkCount[e.source] || 0) + 1;
          linkCount[e.target] = (linkCount[e.target] || 0) + 1;
        });

        const nodes: GraphNode[] = data.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          color: TYPE_COLORS[n.type] || '#9ca3af',
          size: Math.min(16, Math.max(4, 4 + (linkCount[n.id] || 0) * 1.5)),
        }));
        const links: GraphLink[] = data.edges.map((e) => ({
          source: e.source,
          target: e.target,
          relation: e.relation,
        }));
        setGraphData({ nodes, links });
      })
      .catch(() => setGraphData({ nodes: [], links: [] }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scope]);

  // Filtered data
  const filteredData = {
    nodes: graphData.nodes.filter((n) => visibleTypes.has(n.type)),
    links: graphData.links.filter((l) => {
      const src = typeof l.source === 'string' ? l.source : l.source.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target.id;
      const nodeIds = new Set(graphData.nodes.filter((n) => visibleTypes.has(n.type)).map((n) => n.id));
      return nodeIds.has(src) && nodeIds.has(tgt);
    }),
  };

  const handleNodeClick = useCallback(
    (node: any) => {
      if (node.type === 'PROJECT') navigate(`/projects/${node.id}`);
      else if (node.type === 'ISSUE') navigate(`/issues/${node.id}`);
      else if (node.type === 'NOTE') navigate(`/meeting-notes/${node.id}`);
    },
    [navigate],
  );

  const toggleType = (type: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/kms')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:back')}
          </button>
          <h1 className="text-lg font-bold text-gray-900">{t('kms:ambGraph.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 p-0.5 text-sm">
            <button
              onClick={() => setScope('MY')}
              className={`rounded-md px-3 py-1 transition-colors ${scope === 'MY' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
            >
              {t('kms:ambGraph.scopeMy')}
            </button>
            <button
              onClick={() => setScope('ENTITY')}
              className={`rounded-md px-3 py-1 transition-colors ${scope === 'ENTITY' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}
            >
              {t('kms:ambGraph.scopeAll')}
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg border border-gray-300 p-2 transition-colors ${showFilters ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <Filter className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <label key={type} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={visibleTypes.has(type)}
                onChange={() => toggleType(type)}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] }}
              />
              <span className="text-gray-600">{label}</span>
            </label>
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {filteredData.nodes.length} {t('kms:ambGraph.nodes')} · {filteredData.links.length} {t('kms:ambGraph.edges')}
          </span>
        </div>
      )}

      {/* Graph */}
      <div ref={containerRef} className="relative flex-1 bg-gray-900">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-400">{t('common:loading')}</div>
          </div>
        ) : filteredData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-400">
              <p>{t('kms:ambGraph.noData')}</p>
              <p className="mt-1 text-xs">{t('kms:ambGraph.noDataHint')}</p>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-gray-400">{t('common:loading')}</div>
            }
          >
            <ForceGraph2D
              width={dimensions.width}
              height={dimensions.height}
              graphData={filteredData}
              nodeLabel={(node: any) => `[${node.type}] ${node.label}`}
              nodeColor={(node: any) => node.color || '#9ca3af'}
              nodeRelSize={1}
              nodeVal={(node: any) => node.size || 4}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const r = Math.sqrt(node.size || 4) * 2;
                // Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fillStyle = node.color || '#9ca3af';
                ctx.fill();
                // Label (only when zoomed in)
                if (globalScale > 1.2) {
                  const fontSize = Math.max(10 / globalScale, 2);
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = '#e5e7eb';
                  const label =
                    node.label?.length > 20 ? node.label.substring(0, 20) + '...' : node.label;
                  ctx.fillText(label, node.x, node.y + r + 1);
                }
              }}
              linkColor={(link: any) =>
                link.relation === 'WIKI_LINK' ? 'rgba(250, 204, 21, 0.4)' : 'rgba(156, 163, 175, 0.3)'
              }
              linkWidth={(link: any) => (link.relation === 'WIKI_LINK' ? 1 : 0.5)}
              linkLineDash={(link: any) => (link.relation === 'WIKI_LINK' ? [4, 2] : [])}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              cooldownTicks={100}
              d3AlphaDecay={0.03}
              d3VelocityDecay={0.4}
              backgroundColor="#111827"
            />
          </Suspense>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 rounded-lg bg-gray-800/80 px-3 py-2 backdrop-blur-sm">
          <div className="flex flex-wrap gap-3">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-gray-300">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[type] }}
                />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-px w-4 bg-gray-400" />
              FK
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-px w-4 border-t border-dashed border-yellow-400" />
              Wiki Link
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
