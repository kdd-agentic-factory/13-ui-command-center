import type { ToolStatus } from '../services/commandCenterData';
import { PanelHeader } from './PanelHeader';
import { StateTag } from './StateTag';

interface MCPToolMonitorProps {
  tools: ToolStatus[];
}

export function MCPToolMonitor({ tools }: MCPToolMonitorProps) {
  return (
    <section className="panel panel--medium" aria-labelledby="mcp-tools-title">
      <PanelHeader
        kicker="MCP"
        title="Monitor de herramientas"
        titleId="mcp-tools-title"
        action={<StateTag state="warning" />}
      />
      <div className="panel__body">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Namespace</th>
              <th>24h</th>
              <th>p95</th>
              <th>Error</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={`${tool.namespace}.${tool.name}`}>
                <td>
                  <strong>{tool.name}</strong>
                </td>
                <td className="row-subtitle">{tool.namespace}</td>
                <td>{tool.calls24h}</td>
                <td>{tool.p95Ms}ms</td>
                <td>{tool.errorRate}%</td>
                <td>
                  <StateTag state={tool.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
