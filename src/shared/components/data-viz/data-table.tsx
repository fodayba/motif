import { useMemo, useState } from 'react'
import './data-table.css'

export type DataTableColumn<T> = {
  id: string
  label: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string
  title?: string
  emptyMessage?: string
  className?: string
}

type SortConfig = {
  columnId: string
  direction: 'asc' | 'desc'
}

export const DataTable = <T,>({
  columns,
  data,
  keyExtractor,
  title,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data
    }

    const column = columns.find((col) => col.id === sortConfig.columnId)
    if (!column) {
      return data
    }

    return [...data].sort((a, b) => {
      const aValue = column.accessor(a)
      const bValue = column.accessor(b)

      const aStr = String(aValue ?? '')
      const bStr = String(bValue ?? '')

      const comparison = aStr.localeCompare(bStr, undefined, { numeric: true })
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig, columns])

  const handleSort = (columnId: string) => {
    setSortConfig((current) => {
      if (!current || current.columnId !== columnId) {
        return { columnId, direction: 'asc' }
      }

      if (current.direction === 'asc') {
        return { columnId, direction: 'desc' }
      }

      return null
    })
  }

  const classes = ['data-table-wrapper']
  if (className) {
    classes.push(className)
  }

  return (
    <div className={classes.join(' ')}>
      {title ? <h3 className="data-table__title">{title}</h3> : null}
      <div className="data-table__scroll">
        <table className="data-table">
          <thead className="data-table__head">
            <tr>
              {columns.map((column) => {
                const isSorted = sortConfig?.columnId === column.id
                const sortDirection = isSorted ? sortConfig.direction : undefined

                return (
                  <th
                    key={column.id}
                    className="data-table__header"
                    style={{ textAlign: column.align || 'left', width: column.width }}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="data-table__sort-button"
                        onClick={() => handleSort(column.id)}
                      >
                        {column.label}
                        {isSorted ? (
                          <span className="data-table__sort-indicator">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="data-table__body">
            {sortedData.length === 0 ? (
              <tr>
                <td className="data-table__empty" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={keyExtractor(row, index)} className="data-table__row">
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="data-table__cell"
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
