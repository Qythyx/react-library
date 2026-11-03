import type { ReactElement } from 'react';

import { type UserEvent, userEvent } from '@testing-library/user-event';

import { act, render, screen, waitFor, within } from '../test-utils/testUtils.js';
import { Column, DataTable, Group } from './DataTable.js';
import { createMockI18n } from '../test-utils/i18nMock.js';

interface TestRow {
	age: number;
	id: number;
	name: string;
}

describe('DataTable', () => {
	const mockColumns: Column<TestRow>[] = [
		{ isSortable: true, key: 'name', label: 'Name', render: row => row.name },
		{ isSortable: true, key: 'age', label: 'Age', render: row => row.age },
	];
	const mockRows: TestRow[] = [
		{ age: 30, id: 1, name: 'John Doe' },
		{ age: 25, id: 2, name: 'Jane Smith' },
		{ age: 35, id: 3, name: 'Bob Johnson' },
	];
	const getRowKey = (row: TestRow): string => String(row.id);
	const i18n = createMockI18n();
	const onLoad = jest.fn();

	const getBodyRows = (): HTMLElement[] => within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row');

	beforeEach(() => {
		localStorage.clear();
		jest.clearAllMocks();
	});

	it('should render column headers with string labels', async () => {
		render(
			<DataTable<TestRow>
				columns={mockColumns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('Name')).toBeInTheDocument();
		});
	});

	it('should render column headers with element labels', async () => {
		const columnsWithElements: Column<TestRow>[] = [
			{ isSortable: true, key: 'name', label: <span>Name Element</span>, render: row => row.name },
			{ isSortable: true, key: 'age', label: <strong>Age Element</strong>, render: row => row.age },
		];
		render(
			<DataTable<TestRow>
				columns={columnsWithElements}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('Name Element')).toBeInTheDocument();
			expect(screen.getByText('Age Element')).toBeInTheDocument();
		});
	});

	it('should render column headers with mixed string and element labels', async () => {
		const mixedColumns: Column<TestRow>[] = [
			{ isSortable: true, key: 'name', label: 'Name String', render: row => row.name },
			{ isSortable: true, key: 'age', label: <em>Age Element</em>, render: row => row.age },
		];
		render(
			<DataTable<TestRow>
				columns={mixedColumns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('Name String')).toBeInTheDocument();
			expect(screen.getByText('Age Element')).toBeInTheDocument();
		});
	});

	it("should render each cell with its column's render function", async () => {
		const columns: Column<TestRow>[] = [
			...mockColumns,
			{
				isSortable: false,
				key: 'summary',
				label: 'Summary',
				render: row => <b>{`${row.name} is ${row.age}`}</b>,
			},
		];
		render(
			<DataTable<TestRow>
				columns={columns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);

		await waitFor(() => {
			expect(getBodyRows()).toHaveLength(3);
		});
		expect(
			within(getBodyRows()[1]!)
				.getAllByRole('cell')
				.map(cell => cell.textContent),
		).toEqual(['Jane Smith', '25', 'Jane Smith is 25']);
	});

	it("should keep a cell's state with its row when the rows are reordered", async () => {
		const user = userEvent.setup();
		const columns: Column<TestRow>[] = [
			...mockColumns,
			{
				isSortable: false,
				key: 'note',
				label: 'Note',
				render: row => <input aria-label={`Note for ${row.name}`} />,
			},
		];
		const { rerender } = render(
			<DataTable<TestRow>
				columns={columns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);
		await user.type(screen.getByLabelText('Note for John Doe'), 'first');

		rerender(
			<DataTable<TestRow>
				columns={columns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={[...mockRows].reverse()}
				totalCount={3}
			/>,
		);

		expect(screen.getByLabelText('Note for John Doe')).toHaveValue('first');
		expect(screen.getByLabelText('Note for Bob Johnson')).toHaveValue('');
	});

	it('should mark the rows with highlighted keys as selected', async () => {
		render(
			<DataTable<TestRow>
				columns={mockColumns}
				getRowKey={getRowKey}
				highlightedRowKeys={['2']}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
		});
		expect(screen.getByRole('row', { selected: true })).toHaveTextContent('Jane Smith');
	});

	it('should show empty message when no data', async () => {
		render(
			<DataTable<TestRow>
				columns={mockColumns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={[]}
				totalCount={0}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('No data found.')).toBeInTheDocument();
		});
	});

	it('should show custom empty message', async () => {
		render(
			<DataTable<TestRow>
				columns={mockColumns}
				emptyMessage="Custom empty message"
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={[]}
				totalCount={0}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('Custom empty message')).toBeInTheDocument();
		});
	});

	it('should call onLoad on mount', async () => {
		render(
			<DataTable<TestRow>
				columns={mockColumns}
				getRowKey={getRowKey}
				i18n={i18n}
				onLoad={onLoad}
				persistenceKey="test"
				rows={mockRows}
				totalCount={3}
			/>,
		);

		await waitFor(() => {
			expect(onLoad).toHaveBeenCalled();
		});
	});

	describe('Sorting', () => {
		it('should sort ascending when clicking sortable column header', async () => {
			const user = userEvent.setup();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await user.click(screen.getByText('Age'));

			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({ sortAscending: true, sortBy: 'age' }),
				);
			});
		});

		it('should toggle sort direction when clicking same column twice', async () => {
			const user = userEvent.setup();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);
			const nameHeader = screen.getByText('Name');

			await user.click(nameHeader);
			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({ sortAscending: false, sortBy: 'name' }),
				);
			});

			await user.click(nameHeader);
			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({ sortAscending: true, sortBy: 'name' }),
				);
			});
		});

		it('should change sort column when clicking different column', async () => {
			const user = userEvent.setup();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});

			await user.click(screen.getByText('Name'));

			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({
						sortBy: 'name',
					}),
				);
			});

			await user.click(screen.getByText('Age'));

			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({
						sortAscending: true,
						sortBy: 'age',
					}),
				);
			});
		});

		it('should sort by the first sortable column by default', async () => {
			const columns: Column<TestRow>[] = [
				{ isSortable: false, key: 'id', label: 'ID', render: row => row.id },
				...mockColumns,
			];
			render(
				<DataTable<TestRow>
					columns={columns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'name' }));
			});
		});

		it('should ignore a stored sort that no sortable column has', async () => {
			localStorage.setItem('test-table-sort', JSON.stringify({ sortAscending: false, sortBy: 'removed' }));
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ sortAscending: true, sortBy: 'name' }));
			});
		});

		it('should restore a stored sort', async () => {
			localStorage.setItem('test-table-sort', JSON.stringify({ sortAscending: false, sortBy: 'age' }));
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ sortAscending: false, sortBy: 'age' }));
			});
		});

		it.each(['{Enter}', ' '])('should sort when %p is pressed on a sortable header', async key => {
			const user = userEvent.setup();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			screen.getByText('Age').closest('th')!.focus();
			await user.keyboard(key);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ sortAscending: true, sortBy: 'age' }));
			});
		});

		it('should sort by nothing when no column is sortable', async () => {
			const columns: Column<TestRow>[] = [
				{ isSortable: false, key: 'name', label: 'Name', render: row => row.name },
			];
			render(
				<DataTable<TestRow>
					columns={columns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalled();
			});
			expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ sortBy: undefined }));
		});
	});

	describe('Pagination', () => {
		const manyRows = Array.from({ length: 15 }, (_, i): TestRow => ({ age: 20 + i, id: i, name: `Person ${i}` }));

		it('should navigate to next page', async () => {
			const user = userEvent.setup();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={manyRows}
					totalCount={150}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Person 0')).toBeInTheDocument();
			});

			const nextButton = screen.getByLabelText('Next');
			await user.click(nextButton);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(
					expect.objectContaining({
						currentPage: 2,
					}),
				);
			});
		});

		it('should navigate to previous page', async () => {
			const user = userEvent.setup();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={manyRows}
					totalCount={150}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Person 0')).toBeInTheDocument();
			});

			await user.click(screen.getByLabelText('Next'));
			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({
						currentPage: 2,
					}),
				);
			});

			await user.click(screen.getByLabelText('Previous'));
			await waitFor(() => {
				expect(onLoad).toHaveBeenLastCalledWith(
					expect.objectContaining({
						currentPage: 1,
					}),
				);
			});
		});

		describe('when the page changes', () => {
			beforeEach(() => {
				jest.useFakeTimers();
			});

			afterEach(() => {
				jest.useRealTimers();
			});

			// Fires the pending timers one at a time, rendering after each, so timers that fire at different
			// moments in a browser are not batched into one render here.
			const settle = (): void => {
				while (jest.getTimerCount() > 0) {
					act(() => {
						jest.advanceTimersToNextTimer();
					});
				}
			};

			const pagedTable = (
				totalCount: number,
				{ isLoading = false, load = onLoad }: { isLoading?: boolean; load?: jest.Mock } = {},
			): ReactElement => (
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					isLoading={isLoading}
					onLoad={load}
					persistenceKey="test"
					rows={manyRows}
					totalCount={totalCount}
				/>
			);

			const clickNextUntil = async (user: UserEvent, page: number): Promise<void> => {
				for (let i = 1; i < page; i++) {
					await user.click(screen.getByLabelText('Next'));
				}
				settle();
				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: page }));
			};

			it('should move to the last page and load it once when the rows shrink', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 5);
				onLoad.mockClear();

				rerender(pagedTable(30));

				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 2 }));
				expect(screen.getByLabelText('Go to page')).toHaveValue('2');
				expect(screen.getByText('/ 2')).toBeInTheDocument();
				settle();
				expect(onLoad).toHaveBeenCalledTimes(1);
			});

			it('should load only the last page when a new onLoad comes with the shrunk rows', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 5);
				const nextLoad = jest.fn();

				rerender(pagedTable(30, { load: nextLoad }));
				settle();

				expect(nextLoad).toHaveBeenCalledTimes(1);
				expect(nextLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 2 }));
			});

			it('should move to page 1 and load it once when there are no rows', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 3);
				onLoad.mockClear();

				rerender(pagedTable(0));
				settle();

				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 1 }));
				expect(screen.getByLabelText('Go to page')).toHaveValue('1');
			});

			it('should not reload when the page is still the last one after the rows shrink', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 3);
				onLoad.mockClear();

				rerender(pagedTable(41));
				settle();

				expect(onLoad).not.toHaveBeenCalled();
			});

			it('should keep the page while loading, when the row count is not known yet', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 2);
				onLoad.mockClear();

				rerender(pagedTable(0, { isLoading: true }));
				settle();
				rerender(pagedTable(100));
				settle();

				expect(onLoad).not.toHaveBeenCalled();
				expect(screen.getByLabelText('Go to page')).toHaveValue('2');
			});

			it('should lower a typed page that the shrunk rows leave past the end', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				settle();
				onLoad.mockClear();
				await user.clear(screen.getByLabelText('Go to page'));
				await user.type(screen.getByLabelText('Go to page'), '5');

				rerender(pagedTable(30));

				expect(screen.getByLabelText('Go to page')).toHaveValue('2');
				settle();
				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 2 }));
			});

			it('should load a typed page that matches the page before a sort', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				await clickNextUntil(user, 3);
				await user.click(screen.getByText('Age'));
				await user.clear(screen.getByLabelText('Go to page'));
				await user.type(screen.getByLabelText('Go to page'), '3');
				settle();

				expect(screen.getByLabelText('Go to page')).toHaveValue('3');
				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 3, sortBy: 'age' }));
			});

			it('should load page 1 when the page field is cleared right after Next', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				settle();
				await user.click(screen.getByLabelText('Next'));
				await user.clear(screen.getByLabelText('Go to page'));
				settle();

				expect(screen.getByLabelText('Go to page')).toHaveValue('1');
				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 1 }));
			});

			it('should load only the typed page when the rows shrink before it is loaded', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 5);
				onLoad.mockClear();
				await user.type(screen.getByLabelText('Go to page'), '1', {
					initialSelectionEnd: 1,
					initialSelectionStart: 0,
				});

				rerender(pagedTable(30));
				settle();

				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 1 }));
			});

			it('should not cap a page typed while loading by the row count from before', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(0, { isLoading: true }));
				await user.clear(screen.getByLabelText('Go to page'));
				await user.type(screen.getByLabelText('Go to page'), '3');

				rerender(pagedTable(100));
				settle();

				expect(screen.getByLabelText('Go to page')).toHaveValue('3');
				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 3 }));
			});

			it('should step from a typed page that is not loaded yet', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				settle();
				await user.clear(screen.getByLabelText('Go to page'));
				await user.type(screen.getByLabelText('Go to page'), '3');

				await user.click(screen.getByLabelText('Next'));
				settle();

				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 4 }));
			});

			it('should step back from a typed page that is not loaded yet', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				settle();
				await user.clear(screen.getByLabelText('Go to page'));
				await user.type(screen.getByLabelText('Go to page'), '3');

				await user.click(screen.getByLabelText('Previous'));
				settle();

				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 2 }));
			});

			it('should load page 1 once when a larger page size leaves fewer pages', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				await clickNextUntil(user, 5);
				onLoad.mockClear();

				await user.clear(screen.getByLabelText('Items per page'));
				await user.type(screen.getByLabelText('Items per page'), '50');
				settle();

				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 1, pageSize: 50 }));
			});

			it('should load page 1 once when every row is shown', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				const { rerender } = render(pagedTable(100));
				await clickNextUntil(user, 5);
				// While loading the table doesn't fit the page to the rows, so only the show-all reset can reach page 1.
				rerender(pagedTable(100, { isLoading: true }));
				onLoad.mockClear();

				await user.click(screen.getByRole('checkbox', { name: 'All' }));
				settle();

				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 1, showAll: true }));
			});

			it('should drop a typed page that is not loaded yet when the sort changes', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				settle();
				await user.clear(screen.getByLabelText('Go to page'));
				await user.type(screen.getByLabelText('Go to page'), '3');
				act(() => {
					jest.advanceTimersByTime(200);
				});

				await user.click(screen.getByText('Age'));
				settle();

				expect(onLoad).not.toHaveBeenCalledWith(expect.objectContaining({ currentPage: 3 }));
				expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 1, sortBy: 'age' }));
			});

			it('should load page 1 once when the sort changes', async () => {
				const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
				render(pagedTable(100));
				await clickNextUntil(user, 2);
				onLoad.mockClear();

				await user.click(screen.getByText('Age'));
				settle();

				expect(onLoad).toHaveBeenCalledTimes(1);
				expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ currentPage: 1, sortBy: 'age' }));
			});
		});

		it('should render page size selector', async () => {
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={50}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});

			expect(screen.getByLabelText('Items per page')).toBeInTheDocument();
		});
	});

	describe('Row interaction', () => {
		it('should call onRowClick with the clicked row', async () => {
			const user = userEvent.setup();
			const onRowClick = jest.fn();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					onRowClick={onRowClick}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await user.click(screen.getByText('Jane Smith'));

			expect(onRowClick).toHaveBeenCalledWith(mockRows[1]);
		});

		it.each(['{Enter}', ' '])('should call onRowClick when %p is pressed on a row', async key => {
			const user = userEvent.setup();
			const onRowClick = jest.fn();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					onRowClick={onRowClick}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			getBodyRows()[2]!.focus();
			await user.keyboard(key);

			expect(onRowClick).toHaveBeenCalledWith(mockRows[2]);
		});

		it('should leave keys pressed in a control inside a row to that control', async () => {
			const user = userEvent.setup();
			const onRowClick = jest.fn();
			const columns: Column<TestRow>[] = [
				...mockColumns,
				{
					isSortable: false,
					key: 'note',
					label: 'Note',
					render: row => <input aria-label={`Note for ${row.name}`} />,
				},
			];
			render(
				<DataTable<TestRow>
					columns={columns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					onRowClick={onRowClick}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			screen.getByLabelText('Note for John Doe').focus();
			await user.keyboard('a b{Enter}');

			expect(screen.getByLabelText('Note for John Doe')).toHaveValue('a b');
			expect(onRowClick).not.toHaveBeenCalled();
		});
	});

	describe('Groups', () => {
		it("should show each group's rows under its header, in the group's order", async () => {
			const [john, jane, bob] = mockRows;
			const groups: Group<TestRow>[] = [
				{ header: <div>Group 1</div>, key: 'group1', rows: [bob!, john!] },
				{ header: <div>Group 2</div>, key: 'group2', rows: [jane!] },
			];

			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					groups={groups}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Group 1')).toBeInTheDocument();
			});
			expect(getBodyRows().map(row => row.textContent)).toEqual([
				'Group 1',
				'Bob Johnson35',
				'John Doe30',
				'Group 2',
				'Jane Smith25',
			]);
		});

		it('should render group actions', async () => {
			const groups: Group<TestRow>[] = [
				{
					actions: <button>Group Action</button>,
					header: <div>Group 1</div>,
					key: 'group1',
					rows: [mockRows[0]!],
				},
			];

			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					groups={groups}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Group Action')).toBeInTheDocument();
			});
		});

		it('should show the empty message when every group is empty', async () => {
			const groups: Group<TestRow>[] = [{ header: <div>Group 1</div>, key: 'group1', rows: [] }];

			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					groups={groups}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					totalCount={0}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('No data found.')).toBeInTheDocument();
			});
			expect(screen.queryByText('Group 1')).not.toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('should show loading indicator when isLoading is true', async () => {
			const { container } = render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					isLoading={true}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				const indicators = container.querySelectorAll('.MuiCircularProgress-root');
				expect(indicators.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Header', () => {
		it('should render header when provided', async () => {
			const header = <div>Custom Header Content</div>;
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					header={header}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Custom Header Content')).toBeInTheDocument();
			});
		});

		it('should not render header when not provided', async () => {
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					getRowKey={getRowKey}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test"
					rows={mockRows}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});

			expect(screen.queryByText('Custom Header Content')).not.toBeInTheDocument();
		});
	});
});
