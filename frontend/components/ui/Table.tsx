import React, { memo } from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
}

export const Table = memo(function Table({ headers, children, style, ...props }: TableProps) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(15, 15, 15, 0.2)', backdropFilter: 'blur(10px)' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13px',
          ...style
        }}
        {...props}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.01)' }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '16px 20px',
                  fontWeight: 600,
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ verticalAlign: 'middle' }}>
          {children}
        </tbody>
      </table>
    </div>
  );
});

Table.displayName = 'Table';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow = memo(function TableRow({ children, style, ...props }: TableRowProps) {
  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        background: 'transparent',
        transition: 'background 200ms ease',
        ...style
      }}
      className="table-row-hover"
      {...props}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = memo(function TableCell({ children, style, ...props }: TableCellProps) {
  return (
    <td
      style={{
        padding: '16px 20px',
        color: '#ffffff',
        verticalAlign: 'middle',
        ...style
      }}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';
