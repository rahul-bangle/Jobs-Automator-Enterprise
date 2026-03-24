function DataTable({ columns, rows, onRowClick }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer transition hover:bg-slate-900/60' : ''}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 align-top text-sm text-slate-200">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
