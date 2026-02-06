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
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { NumberField } from './NumberField.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

export type Column<T> = NonSortableColumn | SortableColumn<T>;

export interface DataTableProps<T> {
	columns: Column<T>[];
	data: (React.ReactElement | string)[][];
	emptyMessage?: string;
	fullWidth?: boolean;
	groups?: Group[];
	header?: React.ReactElement;
	i18n?: i18n;
	initialPageSize?: number;
	isLoading?: boolean;
	loadingIndicatorDelay?: number;
	onLoad: (params: LoadParams<T>) => void;
	onRowClick?: (rowIndex: number) => void;
	persistenceKey?: string;
	scrollInternally?: boolean;
	totalCount: number;
}

export interface Group {
	actions?: React.ReactElement;
	header: React.ReactElement;
	key: string;
	rows: number[];
}

export interface LoadParams<T> {
	currentPage: number;
	pageSize: number;
	showAll: boolean;
	sortAscending: boolean;
	sortBy: SortableFields<T>;
}

export type SortableFields<T> = Exclude<keyof T, 'id'>;

interface BaseColumn {
	align?: 'center' | 'left' | 'right' | undefined;
	label: React.ReactElement | string;
	size?: ColumnSize;
}

type ColumnSize = 'fill' | 'minimum';

interface NonSortableColumn extends BaseColumn {
	isSortable: false;
	key: string;
}

interface SortableColumn<T> extends BaseColumn {
	isSortable: true;
	key: SortableFields<T>;
}

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

const DataTableComponent = <T extends object>({
	columns,
	data,
	emptyMessage,
	fullWidth = true,
	groups,
	header,
	i18n,
	initialPageSize = 20,
	isLoading = false,
	loadingIndicatorDelay = 200,
	onLoad,
	onRowClick,
	persistenceKey,
	scrollInternally = false,
	totalCount,
}: DataTableProps<T>): React.ReactElement => {
	const { t } = i18n ?? { t: ((key: string): string => key) as TFunction };
	const [, forceUpdate] = useState({});

	// Add library translations on mount
	if (i18n) {
		useEffect(() => {
			Promise.all([
				import('../../public/locales/en/translation.json').then(en => {
					i18n.addResourceBundle('en', 'translation', en.default, true, false);
				}),
				import('../../public/locales/ja/translation.json').then(ja => {
					i18n.addResourceBundle('ja', 'translation', ja.default, true, false);
				}),
			]).then(() => {
				// Force re-render after translations are loaded
				forceUpdate({});
			});
		}, [i18n]);
	}

	const getKey = (area: string): string => `${persistenceKey}-table-${area}`;

	// Persistent settings with both getters and setters
	const [paginationSettings, setPaginationSettings] = useLocalStorage(getKey('pagination'), {
		pageSize: initialPageSize,
		showAll: false,
	});

	const [sortSettings, setSortSettings] = useLocalStorage(getKey('sort'), {
		sortAscending: true,
		sortBy: columns[0]?.key ?? 'id',
	});

	const [sortBy, setSortBy] = useState<SortableFields<T>>(sortSettings.sortBy as SortableFields<T>);
	const [sortAscending, setSortAscending] = useState<boolean>(sortSettings.sortAscending);
	const [debouncedCurrentPage, setCurrentPage, currentPage] = useDebounce(1);
	const [debouncedPageSize, setPageSize, pageSize] = useDebounce(paginationSettings.pageSize);
	const [showLoadingIndicator, setShowLoadingIndicator] = useDebounce(isLoading, loadingIndicatorDelay);

	const totalPages = useMemo(
		() => (paginationSettings.showAll ? 1 : Math.max(1, Math.ceil(totalCount / paginationSettings.pageSize))),
		[paginationSettings.showAll, totalCount, paginationSettings.pageSize],
	);

	useEffect(() => setPageSize(paginationSettings.pageSize), [paginationSettings.pageSize]);
	useEffect(() => setShowLoadingIndicator(isLoading), [isLoading]);
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
		(column: SortableFields<T>): void => {
			if (sortBy === column) {
				setSortAscending(!sortAscending);
				setSortSettings({ sortAscending: !sortAscending, sortBy: column as string });
			} else {
				setSortBy(column);
				setSortAscending(true);
				setSortSettings({ sortAscending: true, sortBy: column as string });
			}
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
		(column: Column<T>): null | React.ReactElement => {
			if (!column.isSortable || sortBy !== column.key) {
				return null;
			}
			return sortAscending ? <KeyboardArrowUp /> : <KeyboardArrowDown />;
		},
		[sortBy, sortAscending],
	);

	const getColumnStyles = useCallback((size?: ColumnSize): React.CSSProperties => {
		switch (size) {
			case 'fill':
				// For 'fill' columns, don't set width - let them expand naturally
				return {};
			case 'minimum':
			default:
				// Force minimum width, content determines size
				return { whiteSpace: 'nowrap', width: '1%' };
		}
	}, []);

	// Memoize table header rendering
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
							key={String(col.key)}
							onClick={col.isSortable ? (): void => handleSortColumn(col.key) : undefined}
							onKeyDown={
								col.isSortable
									? (e): void => {
											if (e.key === 'Enter' || e.key === ' ') {
												handleSortColumn(col.key);
											}
										}
									: undefined
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
		[columns, handleSortColumn, getColumnStyles, getSortIcon, i18n],
	);

	const renderGroupedRows = useMemo(
		() =>
			(groups ?? []).map(group => (
				<React.Fragment key={group.key}>
					<GroupRow actions={group.actions} colSpan={columns.length}>
						{group.header}
					</GroupRow>
					{group.rows.map(rowIndex => {
						const row = data[rowIndex];
						if (!row) {
							return null;
						}
						return (
							<TableRow
								hover
								key={`row-${rowIndex}`}
								onClick={onRowClick ? (): void => onRowClick(rowIndex) : undefined}
								sx={{
									cursor: onRowClick ? 'pointer' : 'default',
								}}
							>
								{row.map((cell, cellIndex) => (
									<TableCell
										align={columns[cellIndex]?.align}
										key={`cell-${rowIndex}-${cellIndex}`}
										sx={{
											height: '1px',
											...getColumnStyles(columns[cellIndex]?.size),
										}}
									>
										{cell}
									</TableCell>
								))}
							</TableRow>
						);
					})}
				</React.Fragment>
			)),
		[columns, data, groups, onRowClick],
	);

	const renderEmptyTable = useMemo(
		() => (
			<TableRow>
				<TableCell align="center" colSpan={columns.length}>
					<Typography color="text.secondary" fontStyle="italic" variant="body2">
						{emptyMessage ?? t('dataTable.emptyMessage')}
					</Typography>
				</TableCell>
			</TableRow>
		),
		[columns, emptyMessage, t],
	);

	const renderRows = useMemo(
		() =>
			data.map((row, rowIndex) => (
				<TableRow
					hover
					key={`row-${rowIndex}`}
					onClick={onRowClick ? (): void => onRowClick(rowIndex) : undefined}
					sx={{
						cursor: onRowClick ? 'pointer' : 'default',
					}}
				>
					{row.map((cell, cellIndex) => (
						<TableCell
							align={columns[cellIndex]?.align}
							key={`cell-${rowIndex}-${cellIndex}`}
							sx={{
								height: '1px',
								...getColumnStyles(columns[cellIndex]?.size),
							}}
						>
							{cell}
						</TableCell>
					))}
				</TableRow>
			)),
		[columns, data, onRowClick],
	);

	// Memoize table body rendering
	const tableBody = useMemo(
		() => <TableBody>{data.length === 0 ? renderEmptyTable : groups ? renderGroupedRows : renderRows}</TableBody>,
		[
			data,
			columns,
			emptyMessage,
			getColumnStyles,
			showLoadingIndicator,
			paginationSettings.pageSize,
			onRowClick,
			groups,
			t,
		],
	);

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

					<Stack alignItems="center" direction="row" spacing={1}>
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

					<Stack alignItems="center" direction="row" spacing={2}>
						{!paginationSettings.showAll && (
							<Stack alignItems="center" direction="row" spacing={1}>
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

export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;
