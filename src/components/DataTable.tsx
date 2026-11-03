import {
	Box,
	Card,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { i18n, TFunction } from 'i18next';
import { KeyboardArrowDown, KeyboardArrowUp, NavigateBefore, NavigateNext } from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo } from 'react';

import { loadTranslations } from '../utils/loadTranslations.js';
import { NumberField } from './NumberField.js';
import { useDebouncedState } from '../hooks/useDebouncedState.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

/**
 * A column of a {@link DataTable}: its header and how it shows each row.
 */
export type Column<T, TSortKey extends string = StringKeyOf<T>> = NonSortableColumn<T> | SortableColumn<T, TSortKey>;

/**
 * The props of a {@link DataTable} showing records of type `T`, whose sortable columns are keyed by
 * `TSortKey`.
 * The rows are given either as one list or split into groups.
 */
export type DataTableProps<T, TSortKey extends string = StringKeyOf<T>> = (
	| {
			/** The groups to show, in order, each with its rows under its header. */
			groups: readonly Group<T>[];
			rows?: never;
	  }
	| {
			groups?: never;
			/** The rows to show, in order. */
			rows: readonly T[];
	  }
) &
	BaseDataTableProps<T, TSortKey>;

/** A group of rows shown under a header row of its own. */
export interface Group<T> {
	/** Shown at the end of the group's header row. */
	actions?: React.ReactElement;
	/** Shown in the group's header row, above its rows. */
	header: React.ReactElement;
	/** Identifies the group among the table's groups. */
	key: string;
	/** The group's rows, in order. */
	rows: readonly T[];
}

/** The page of rows to load and their order. */
export interface LoadParams<TSortKey extends string> {
	/** The page to show, starting at 1. */
	currentPage: number;
	/** The number of rows on a page. */
	pageSize: number;
	/** Whether to show every row on one page, ignoring `currentPage` and `pageSize`. */
	showAll: boolean;
	/** Whether to sort by `sortBy` in ascending order, rather than descending. */
	sortAscending: boolean;
	/** The key of the sortable column to sort by, absent when no column is sortable. */
	sortBy?: TSortKey;
}

/** The keys of `T` that are strings. */
export type StringKeyOf<T> = Extract<keyof T, string>;

interface BaseColumn<T> {
	/** How the column's cells align their content. */
	align?: 'center' | 'left' | 'right' | undefined;
	/** Shown in the column's header. */
	label: React.ReactElement | string;
	/**
	 * Returns what the column's cell shows for `row`. It is called while the table renders, so it must
	 * not call hooks; put a cell that needs hooks in a component of its own and return that.
	 */
	render: (row: T) => React.ReactNode;
	/**
	 * How wide the column is: `fill` takes the width left over, and `minimum`, the default, only what its
	 * content needs.
	 */
	size?: ColumnSize;
}

interface BaseDataTableProps<T, TSortKey extends string> {
	/** The table's columns, in order. */
	columns: readonly Column<T, TSortKey>[];
	/**
	 * Shown in place of the table body when there are no rows: no `rows`, no groups, or only empty groups,
	 * whose headers are then hidden too. Defaults to the translated "No data found.".
	 */
	emptyMessage?: string;
	/** Whether the table is as wide as its container (the default), rather than as wide as its content. */
	fullWidth?: boolean;
	/** Returns the key that identifies `row` among the table's rows. */
	getRowKey: (row: T) => string;
	/** Shown above the table. */
	header?: React.ReactElement;
	/** The keys of the rows to show as selected. */
	highlightedRowKeys?: readonly string[];
	/** Translates the table's own text. Without it the table shows its translation keys. */
	i18n?: i18n;
	/** The page size when none is stored under `persistenceKey`; 20 by default. */
	initialPageSize?: number;
	/**
	 * Whether rows are being loaded. It disables the previous and next page buttons and, after
	 * `loadingIndicatorDelay`, covers the table with a loading indicator.
	 */
	isLoading?: boolean;
	/**
	 * How long, in milliseconds, loading must last before the loading indicator shows, and how long the
	 * indicator stays after loading ends; 200 by default.
	 */
	loadingIndicatorDelay?: number;
	/**
	 * Called when the table mounts, whenever any of its {@link LoadParams} change, and whenever `onLoad`
	 * itself changes. Pass a new `onLoad` to reload, such as when a filter outside the table changes, and
	 * otherwise keep it stable, for example with `useCallback`: an `onLoad` made anew on every render
	 * loads on every render.
	 */
	onLoad: (params: LoadParams<TSortKey>) => void;
	/** Called with the row the user clicked, or pressed Enter or Space on. */
	onRowClick?: (row: T) => void;
	/**
	 * Identifies the table's page size, show-all choice and sort order in local storage, so it must differ
	 * between tables.
	 */
	persistenceKey: string;
	/**
	 * Whether the table fills its flex parent and scrolls inside its own box, keeping the header and
	 * footer in view. The parent must have a bounded height.
	 */
	scrollInternally?: boolean;
	/** The number of rows across every page. */
	totalCount: number;
}

type ColumnSize = 'fill' | 'minimum';

interface NonSortableColumn<T> extends BaseColumn<T> {
	/** Whether the user can sort by the column by choosing its header. */
	isSortable: false;
	/** Identifies the column among the table's columns. */
	key: string;
}

interface SortableColumn<T, TSortKey extends string> extends BaseColumn<T> {
	/** Whether the user can sort by the column by choosing its header. */
	isSortable: true;
	/**
	 * Identifies the column among the table's columns, and is the {@link LoadParams.sortBy} reported while
	 * the table is sorted by the column.
	 */
	key: TSortKey;
}

const untranslated = ((key: string): string => key) as TFunction;

const getColumnStyles = (size?: ColumnSize): React.CSSProperties => {
	switch (size) {
		case 'fill':
			return {};
		case 'minimum':
		default:
			// A 1% width shrinks the column to its content.
			return { whiteSpace: 'nowrap', width: '1%' };
	}
};

/**
 * Makes a key handler that calls `onActivate`, as a click would, when Enter or Space is pressed on the
 * element itself. Keys pressed in a control inside the element are left to that control.
 * @param onActivate - What the click does.
 * @returns The key handler.
 */
const enterOrSpaceHandler =
	(onActivate: () => void) =>
	(e: React.KeyboardEvent): void => {
		if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onActivate();
		}
	};

const GroupRow: React.FC<{ actions?: React.ReactElement; children: React.ReactNode; colSpan: number }> = ({
	actions,
	children,
	colSpan,
}) => (
	<TableRow>
		<TableCell colSpan={colSpan} sx={{ backgroundColor: 'action.hover' }}>
			<Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
				{children}
				{actions && <Box>{actions}</Box>}
			</Box>
		</TableCell>
	</TableRow>
);

const DataTableComponent = <T extends object, TSortKey extends string = StringKeyOf<T>>({
	columns,
	emptyMessage,
	fullWidth = true,
	getRowKey,
	groups,
	header,
	highlightedRowKeys,
	i18n,
	initialPageSize = 20,
	isLoading = false,
	loadingIndicatorDelay = 200,
	onLoad,
	onRowClick,
	persistenceKey,
	rows,
	scrollInternally = false,
	totalCount,
}: DataTableProps<T, TSortKey>): React.ReactElement => {
	loadTranslations(i18n);
	const t = i18n?.t ?? untranslated;

	const getKey = (area: string): string => `${persistenceKey}-table-${area}`;

	const [paginationSettings, setPaginationSettings] = useLocalStorage(getKey('pagination'), {
		pageSize: initialPageSize,
		showAll: false,
	});

	// The stored sort can name a column that is no longer sortable; it is then ignored.
	const [sortSettings, setSortSettings] = useLocalStorage<{ sortAscending: boolean; sortBy?: string }>(
		getKey('sort'),
		{ sortAscending: true },
	);
	const sortableKeys = columns.flatMap(col => (col.isSortable ? [col.key] : []));
	const sortBy = sortableKeys.find(key => key === sortSettings.sortBy) ?? sortableKeys[0];
	const sortAscending = sortBy === sortSettings.sortBy ? sortSettings.sortAscending : true;

	const [debouncedCurrentPage, setCurrentPage, currentPage] = useDebouncedState(1);
	const [debouncedPageSize, setPageSize, pageSize] = useDebouncedState(paginationSettings.pageSize);
	const showLoadingIndicator = useDebouncedValue(isLoading, loadingIndicatorDelay);

	const totalPages = useMemo(
		() => (paginationSettings.showAll ? 1 : Math.max(1, Math.ceil(totalCount / paginationSettings.pageSize))),
		[paginationSettings.showAll, totalCount, paginationSettings.pageSize],
	);

	useEffect(() => setPageSize(paginationSettings.pageSize), [paginationSettings.pageSize]);
	useEffect(
		() =>
			onLoad({
				currentPage: debouncedCurrentPage,
				pageSize: paginationSettings.pageSize,
				showAll: paginationSettings.showAll,
				sortAscending,
				sortBy,
			}),
		[debouncedCurrentPage, paginationSettings.pageSize, paginationSettings.showAll, sortBy, sortAscending, onLoad],
	);

	const handleSortColumn = useCallback(
		(column: TSortKey): void => {
			setSortSettings({ sortAscending: column === sortBy ? !sortAscending : true, sortBy: column });
			setCurrentPage(1);
		},
		[sortBy, sortAscending, setSortSettings, setCurrentPage],
	);

	const handlePageSizeChange = useCallback(
		(size: number): void => {
			setCurrentPage(1);
			setPaginationSettings(prev => ({ ...prev, pageSize: size }));
		},
		[setPaginationSettings, setCurrentPage],
	);

	const handleShowAllChange = useCallback(
		(newShowAll: boolean): void => {
			setCurrentPage(1);
			setPaginationSettings(prev => ({ ...prev, showAll: newShowAll }));
		},
		[setPaginationSettings, setCurrentPage],
	);

	useEffect(() => {
		const size = debouncedPageSize;
		if (!isNaN(size) && size >= 1) {
			handlePageSizeChange(size);
		}
	}, [debouncedPageSize, handlePageSizeChange]);

	const handleNextPage = useCallback((): void => {
		if (currentPage < totalPages && !isLoading) {
			setCurrentPage(currentPage + 1, true);
		}
	}, [currentPage, totalPages, isLoading, setCurrentPage]);

	const handlePreviousPage = useCallback((): void => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1, true);
		}
	}, [currentPage, setCurrentPage]);

	const getSortIcon = useCallback(
		(column: Column<T, TSortKey>): null | React.ReactElement => {
			if (!column.isSortable || sortBy !== column.key) {
				return null;
			}
			return sortAscending ? <KeyboardArrowUp /> : <KeyboardArrowDown />;
		},
		[sortBy, sortAscending],
	);

	const tableHeader = useMemo(
		() => (
			<TableHead>
				<TableRow>
					{columns.map(col => (
						<TableCell
							align={col.align}
							aria-label={
								col.isSortable && typeof col.label === 'string'
									? t('dataTable.sortBy', { label: col.label })
									: undefined
							}
							key={col.key}
							onClick={col.isSortable ? (): void => handleSortColumn(col.key) : undefined}
							onKeyDown={
								col.isSortable ? enterOrSpaceHandler(() => handleSortColumn(col.key)) : undefined
							}
							role={col.isSortable ? 'button' : undefined}
							sx={{
								'&:hover': col.isSortable ? { backgroundColor: 'action.hover' } : {},
								cursor: col.isSortable ? 'pointer' : 'default',
								userSelect: 'none',
								...getColumnStyles(col.size),
								whiteSpace: 'nowrap',
							}}
							tabIndex={col.isSortable ? 0 : undefined}
						>
							<Box
								sx={{
									alignItems: 'center',
									display: 'flex',
									justifyContent: 'space-between',
									width: '100%',
								}}
							>
								{col.label}
								{getSortIcon(col)}
							</Box>
						</TableCell>
					))}
				</TableRow>
			</TableHead>
		),
		[columns, handleSortColumn, getSortIcon, t],
	);

	const tableBody = useMemo((): React.ReactElement => {
		const renderRow = (row: T): React.ReactElement => {
			const rowKey = getRowKey(row);
			const isHighlighted = highlightedRowKeys?.includes(rowKey) ?? false;
			return (
				<TableRow
					aria-selected={isHighlighted || undefined}
					hover
					key={rowKey}
					onClick={onRowClick ? (): void => onRowClick(row) : undefined}
					onKeyDown={onRowClick ? enterOrSpaceHandler(() => onRowClick(row)) : undefined}
					selected={isHighlighted}
					sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
					tabIndex={onRowClick ? 0 : undefined}
				>
					{columns.map(col => (
						<TableCell align={col.align} key={col.key} sx={{ height: '1px', ...getColumnStyles(col.size) }}>
							{col.render(row)}
						</TableCell>
					))}
				</TableRow>
			);
		};

		let content: React.ReactNode;
		if (groups ? groups.every(group => group.rows.length === 0) : rows.length === 0) {
			content = (
				<TableRow>
					<TableCell align="center" colSpan={columns.length}>
						<Typography color="text.secondary" sx={{ fontStyle: 'italic' }} variant="body2">
							{emptyMessage ?? t('dataTable.emptyMessage')}
						</Typography>
					</TableCell>
				</TableRow>
			);
		} else if (groups) {
			content = groups.map(group => (
				<React.Fragment key={group.key}>
					<GroupRow actions={group.actions} colSpan={columns.length}>
						{group.header}
					</GroupRow>
					{group.rows.map(renderRow)}
				</React.Fragment>
			));
		} else {
			content = rows.map(renderRow);
		}
		return <TableBody>{content}</TableBody>;
	}, [columns, emptyMessage, getRowKey, groups, highlightedRowKeys, onRowClick, rows, t]);

	return (
		<Box
			sx={{
				flex: scrollInternally ? 1 : undefined,
				minHeight: scrollInternally ? 0 : undefined,
				position: 'relative',
			}}
		>
			<Card
				sx={{
					display: 'flex',
					flexDirection: 'column',
					height: scrollInternally ? '100%' : undefined,
					width: fullWidth ? '100%' : 'fit-content',
				}}
			>
				{/* Optional Header */}
				{header && (
					<Box
						sx={{
							borderBottom: 1,
							borderColor: 'divider',
							p: 0,
						}}
					>
						{header}
					</Box>
				)}

				<TableContainer
					sx={{
						flex: scrollInternally ? 1 : undefined,
						overflowY: scrollInternally ? 'auto' : undefined,
					}}
				>
					<Table stickyHeader={scrollInternally} sx={{ tableLayout: 'auto' }}>
						{tableHeader}
						{tableBody}
					</Table>
				</TableContainer>

				{/* Pagination Footer */}
				<Box
					sx={{
						alignItems: 'center',
						borderColor: 'divider',
						borderTop: 1,
						display: 'flex',
						flexWrap: 'wrap',
						gap: 1,
						justifyContent: 'space-between',
						p: 1,
					}}
				>
					<Typography color="text.secondary" variant="body2">
						{t('dataTable.list.total', { count: totalCount })}
					</Typography>

					<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
						{!paginationSettings.showAll && (
							<>
								<IconButton
									aria-label={t('dataTable.list.previous')}
									disabled={isLoading || currentPage <= 1}
									onClick={handlePreviousPage}
									size="small"
								>
									<NavigateBefore />
								</IconButton>
								<NumberField
									onChange={e => setCurrentPage(Math.max(1, Math.min(totalPages, e)))}
									size="small"
									slotProps={{
										htmlInput: { pattern: '[0-9]*' },
										input: {
											'aria-label': t('dataTable.goToPage'),
											inputProps: {
												max: totalPages,
												min: 1,
											},
										},
									}}
									sx={{ width: '5em' }}
									value={currentPage}
								/>
								<Typography color="text.secondary" variant="body2">
									/ {totalPages}
								</Typography>
								<IconButton
									aria-label={t('dataTable.list.next')}
									disabled={isLoading || currentPage >= totalPages}
									onClick={handleNextPage}
									size="small"
								>
									<NavigateNext />
								</IconButton>
							</>
						)}
					</Stack>

					<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
						{!paginationSettings.showAll && (
							<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
								<Typography color="text.secondary" variant="body2">
									{t('dataTable.list.itemsPerPage')}
								</Typography>
								<NumberField
									onChange={e => setPageSize(e)}
									size="small"
									slotProps={{
										input: {
											'aria-label': t('dataTable.itemsPerPage'),
											inputProps: {
												min: 1,
											},
										},
									}}
									sx={{ width: '5em' }}
									value={pageSize}
								/>
							</Stack>
						)}

						<FormControlLabel
							control={
								<Checkbox
									checked={paginationSettings.showAll}
									onChange={e => handleShowAllChange(e.target.checked)}
									size="small"
								/>
							}
							label={
								<Typography color="text.secondary" variant="body2">
									{t('dataTable.list.showAll')}
								</Typography>
							}
						/>
					</Stack>
				</Box>
			</Card>
			{showLoadingIndicator && (
				<Box
					sx={{
						alignItems: 'center',
						backgroundColor: 'rgba(255, 255, 255, 0.7)',
						display: 'flex',
						inset: 0,
						justifyContent: 'center',
						position: 'absolute',
						zIndex: 100,
					}}
				>
					<CircularProgress />
				</Box>
			)}
		</Box>
	);
};

/**
 * A paged, sortable table of records. It loads nothing itself: it calls `onLoad` on mount and whenever
 * the {@link LoadParams} or `onLoad` change, and shows the `rows` or `groups` it is given. It keeps the
 * page size, show-all choice and sort order in local storage under `persistenceKey`.
 */
export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;
