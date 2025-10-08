import {
	Box,
	Card,
	Checkbox,
	FormControlLabel,
	IconButton,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, NavigateBefore, NavigateNext } from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NumberField } from './NumberField';
import { useDebounce } from '../hooks/useDebounce';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

export type ColumnSize = 'fill' | 'minimum';

export interface BaseColumn {
	align?: 'center' | 'left' | 'right' | undefined;
	label: string;
	size?: ColumnSize;
}

export type SortableFields<T> = Exclude<keyof T, 'id'>;

export interface SortableColumn<T> extends BaseColumn {
	isSortable: true;
	key: SortableFields<T>;
}

export interface NonSortableColumn extends BaseColumn {
	isSortable: false;
	key: string;
}

export type Column<T> = SortableColumn<T> | NonSortableColumn;

export interface LoadParams<T> {
	currentPage: number;
	pageSize: number;
	showAll: boolean;
	sortAscending: boolean;
	sortBy: SortableFields<T>;
}

export interface Group {
	actions?: React.ReactElement;
	header: React.ReactElement;
	key: string;
	rows: number[];
}

export interface DataTableProps<T> {
	columns: Column<T>[];
	data: (string | React.ReactElement)[][];
	emptyMessage?: string;
	fullWidth?: boolean;
	groups?: Group[];
	isLoading?: boolean;
	onLoad: (params: LoadParams<T>) => void;
	onRowClick?: (rowIndex: number) => void;
	persistenceKey?: string;
	totalCount: number;
}

const GroupRow: React.FC<{ actions?: React.ReactElement; children: React.ReactNode; colSpan: number }> = ({
	children,
	colSpan,
	actions,
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
	isLoading = false,
	onLoad,
	onRowClick,
	persistenceKey,
	totalCount,
}: DataTableProps<T>): React.ReactElement => {
	const { t, i18n } = useTranslation();

	// Add library translations on mount
	useEffect(() => {
		void import('../../public/locales/en/translation.json').then((en: { translation: Record<string, unknown> }) => {
			i18n.addResourceBundle('en', 'translation', en.translation, true, false);
		});
		void import('../../public/locales/ja/translation.json').then((ja: { translation: Record<string, unknown> }) => {
			i18n.addResourceBundle('ja', 'translation', ja.translation, true, false);
		});
	}, [i18n]);

	const getKey = (area: string): string => `${persistenceKey}-table-${area}`;

	// Persistent settings with both getters and setters
	const [paginationSettings, setPaginationSettings] = useLocalStorage(getKey('pagination'), {
		pageSize: 20,
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
	const [debouncedShowSkeleton, setShowSkeleton] = useDebounce(isLoading, 600);

	const totalPages = useMemo(
		() => (paginationSettings.showAll ? 1 : Math.max(1, Math.ceil(totalCount / paginationSettings.pageSize))),
		[paginationSettings.showAll, totalCount, paginationSettings.pageSize],
	);

	useEffect(() => setPageSize(paginationSettings.pageSize), [paginationSettings.pageSize]);
	useEffect(() => setShowSkeleton(isLoading));
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
		(column: Column<T>): React.ReactElement | null => {
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
							key={String(col.key)}
							align={col.align}
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
							sx={{
								'&:hover': col.isSortable ? { backgroundColor: 'action.hover' } : {},
								cursor: col.isSortable ? 'pointer' : 'default',
								userSelect: 'none',
								...getColumnStyles(col.size),
								whiteSpace: 'nowrap',
							}}
							tabIndex={col.isSortable ? 0 : undefined}
							role={col.isSortable ? 'button' : undefined}
							aria-label={col.isSortable ? t('dataTable.sortBy', { label: col.label }) : undefined}
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
		[columns, handleSortColumn, getColumnStyles, getSortIcon, t],
	);

	// Memoize table body rendering
	const tableBody = useMemo(
		() => (
			<TableBody>
				{debouncedShowSkeleton ? (
					// Show skeleton rows while loading
					Array.from(new Array(paginationSettings.pageSize)).map((_, index) => (
						<TableRow key={`skeleton-${index}`}>
							{columns.map((column, columnIndex) => (
								<TableCell
									key={`skeleton-cell-${index}-${columnIndex}`}
									align={column.align}
									sx={{
										...getColumnStyles(column.size),
									}}
								>
									<Skeleton variant="text" />
								</TableCell>
							))}
						</TableRow>
					))
				) : data.length === 0 ? (
					<TableRow>
						<TableCell colSpan={columns.length} align="center">
							<Typography variant="body2" color="text.secondary" fontStyle="italic">
								{emptyMessage ?? t('dataTable.emptyMessage')}
							</Typography>
						</TableCell>
					</TableRow>
				) : groups ? (
					// Render grouped rows
					groups.map(group => (
						<React.Fragment key={group.key}>
							<GroupRow colSpan={columns.length} actions={group.actions}>
								{group.header}
							</GroupRow>
							{group.rows.map(rowIndex => {
								const row = data[rowIndex];
								if (!row) {
									return null;
								}
								return (
									<TableRow
										key={`row-${rowIndex}`}
										hover
										onClick={onRowClick ? (): void => onRowClick(rowIndex) : undefined}
										sx={{
											cursor: onRowClick ? 'pointer' : 'default',
										}}
									>
										{row.map((cell, cellIndex) => (
											<TableCell
												key={`cell-${rowIndex}-${cellIndex}`}
												align={columns[cellIndex]?.align}
												sx={{
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
					))
				) : (
					// Render regular rows
					data.map((row, rowIndex) => (
						<TableRow
							key={`row-${rowIndex}`}
							hover
							onClick={onRowClick ? (): void => onRowClick(rowIndex) : undefined}
							sx={{
								cursor: onRowClick ? 'pointer' : 'default',
							}}
						>
							{row.map((cell, cellIndex) => (
								<TableCell
									key={`cell-${rowIndex}-${cellIndex}`}
									align={columns[cellIndex]?.align}
									sx={{
										...getColumnStyles(columns[cellIndex]?.size),
									}}
								>
									{cell}
								</TableCell>
							))}
						</TableRow>
					))
				)}
			</TableBody>
		),
		[
			data,
			columns,
			emptyMessage,
			getColumnStyles,
			debouncedShowSkeleton,
			paginationSettings.pageSize,
			onRowClick,
			groups,
			t,
		],
	);

	return (
		<Card sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'fit-content' }}>
			<TableContainer sx={{ overflowY: 'auto' }}>
				<Table sx={{ tableLayout: 'auto' }} stickyHeader>
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
				<Typography variant="body2" color="text.secondary">
					{t('dataTable.list.total', { count: totalCount })}
				</Typography>

				<Stack direction="row" spacing={1} alignItems="center">
					{!paginationSettings.showAll && (
						<>
							<IconButton
								onClick={handlePreviousPage}
								disabled={isLoading || currentPage <= 1}
								size="small"
								aria-label={t('dataTable.list.previous')}
							>
								<NavigateBefore />
							</IconButton>
							<NumberField
								value={currentPage}
								onChange={e => setCurrentPage(Math.max(1, Math.min(totalPages, e)))}
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
								size="small"
								sx={{ width: '5em' }}
							/>
							<Typography variant="body2" color="text.secondary">
								/ {totalPages}
							</Typography>
							<IconButton
								onClick={handleNextPage}
								disabled={isLoading || currentPage >= totalPages}
								size="small"
								aria-label={t('dataTable.list.next')}
							>
								<NavigateNext />
							</IconButton>
						</>
					)}
				</Stack>

				<Stack direction="row" spacing={2} alignItems="center">
					{!paginationSettings.showAll && (
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography variant="body2" color="text.secondary">
								{t('dataTable.list.itemsPerPage')}
							</Typography>
							<NumberField
								value={pageSize}
								onChange={e => setPageSize(e)}
								slotProps={{
									input: {
										'aria-label': t('dataTable.itemsPerPage'),
										inputProps: {
											min: 1,
										},
									},
								}}
								size="small"
								sx={{ width: '5em' }}
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
							<Typography variant="body2" color="text.secondary">
								{t('dataTable.list.showAll')}
							</Typography>
						}
					/>
				</Stack>
			</Box>
		</Card>
	);
};

export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;
