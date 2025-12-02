import { Column, DataTable, Group } from './DataTable.js';
import { render, screen, waitFor } from '../test-utils/testUtils.js';
import { createMockI18n } from '../test-utils/i18nMock.js';
import React from 'react';
import userEvent from '@testing-library/user-event';

interface TestRow {
	id: number;
	name: string;
	age: number;
}

describe('DataTable', () => {
	const mockColumns: Column<TestRow>[] = [
		{ isSortable: true, key: 'name', label: 'Name' },
		{ isSortable: true, key: 'age', label: 'Age' },
	];
	const mockData = [
		['John Doe', '30'],
		['Jane Smith', '25'],
		['Bob Johnson', '35'],
	];
	const i18n = createMockI18n();
	const onLoad = jest.fn();

	beforeEach(() => {
		localStorage.clear();
		jest.clearAllMocks();
	});

	it('should render column headers', async () => {
		render(<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={3} />);

		await waitFor(() => {
			expect(screen.getByText('Name')).toBeInTheDocument();
		});
	});

	it('should render row data', async () => {
		render(<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={3} />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
			expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
		});
	});

	it('should show empty message when no data', async () => {
		render(<DataTable<TestRow> columns={mockColumns} data={[]} i18n={i18n} onLoad={onLoad} totalCount={0} />);

		await waitFor(() => {
			expect(screen.getByText('No data found.')).toBeInTheDocument();
		});
	});

	it('should show custom empty message', async () => {
		render(
			<DataTable<TestRow>
				columns={mockColumns}
				data={[]}
				i18n={i18n}
				onLoad={onLoad}
				totalCount={0}
				emptyMessage="Custom empty message"
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText('Custom empty message')).toBeInTheDocument();
		});
	});

	it('should call onLoad on mount', async () => {
		render(<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={3} />);

		await waitFor(() => {
			expect(onLoad).toHaveBeenCalled();
		});
	});

	describe('Sorting', () => {
		it('should sort ascending when clicking sortable column header', async () => {
			const user = userEvent.setup();
			render(<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={3} />);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});

			const nameHeader = screen.getByText('Name');
			await user.click(nameHeader);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(
					expect.objectContaining({
						sortAscending: true,
						sortBy: 'name',
					}),
				);
			});
		});

		it('should toggle sort direction when clicking same column twice', async () => {
			const user = userEvent.setup();
			render(<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={3} />);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});

			const nameHeader = screen.getByText('Name');
			await user.click(nameHeader);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(
					expect.objectContaining({
						sortAscending: true,
						sortBy: 'name',
					}),
				);
			});

			await user.click(nameHeader);

			await waitFor(() => {
				expect(onLoad).toHaveBeenCalledWith(
					expect.objectContaining({
						sortAscending: false,
						sortBy: 'name',
					}),
				);
			});
		});

		it('should change sort column when clicking different column', async () => {
			const user = userEvent.setup();
			render(<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={3} />);

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
	});

	describe('Pagination', () => {
		it('should navigate to next page', async () => {
			const user = userEvent.setup();
			const manyData = Array.from({ length: 15 }, (_, i) => [`Person ${i}`, `${20 + i}`]);
			render(
				<DataTable<TestRow> columns={mockColumns} data={manyData} i18n={i18n} onLoad={onLoad} totalCount={150} />,
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
			const manyData = Array.from({ length: 15 }, (_, i) => [`Person ${i}`, `${20 + i}`]);
			render(
				<DataTable<TestRow> columns={mockColumns} data={manyData} i18n={i18n} onLoad={onLoad} totalCount={150} />,
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

		it('should render page size selector', async () => {
			const { container } = render(
				<DataTable<TestRow> columns={mockColumns} data={mockData} i18n={i18n} onLoad={onLoad} totalCount={50} />,
			);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});

			const select = container.querySelector('[role="button"]');
			expect(select).toBeTruthy();
		});
	});

	describe('Row interaction', () => {
		it('should call onRowClick when row is clicked', async () => {
			const user = userEvent.setup();
			const onRowClick = jest.fn();
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					data={mockData}
					i18n={i18n}
					onLoad={onLoad}
					onRowClick={onRowClick}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('John Doe')).toBeInTheDocument();
			});

			const firstRow = screen.getByText('John Doe').closest('tr');
			if (firstRow) {
				await user.click(firstRow);
			}

			expect(onRowClick).toHaveBeenCalledWith(0);
		});
	});

	describe('Groups', () => {
		it('should render grouped rows', async () => {
			const groups: Group[] = [
				{
					header: <div>Group 1</div>,
					key: 'group1',
					rows: [0, 1],
				},
				{
					header: <div>Group 2</div>,
					key: 'group2',
					rows: [2],
				},
			];

			render(
				<DataTable<TestRow>
					columns={mockColumns}
					data={mockData}
					groups={groups}
					i18n={i18n}
					onLoad={onLoad}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Group 1')).toBeInTheDocument();
				expect(screen.getByText('Group 2')).toBeInTheDocument();
			});
		});

		it('should render group actions', async () => {
			const groups: Group[] = [
				{
					actions: <button>Group Action</button>,
					header: <div>Group 1</div>,
					key: 'group1',
					rows: [0],
				},
			];

			render(
				<DataTable<TestRow>
					columns={mockColumns}
					data={mockData}
					groups={groups}
					i18n={i18n}
					onLoad={onLoad}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Group Action')).toBeInTheDocument();
			});
		});
	});

	describe('Loading state', () => {
		it('should show loading skeleton when isLoading is true', async () => {
			const { container } = render(
				<DataTable<TestRow>
					columns={mockColumns}
					data={mockData}
					i18n={i18n}
					isLoading={true}
					onLoad={onLoad}
					totalCount={3}
				/>,
			);

			await waitFor(() => {
				const skeletons = container.querySelectorAll('.MuiSkeleton-root');
				expect(skeletons.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Persistence', () => {
		it('should render with persistenceKey prop', async () => {
			render(
				<DataTable<TestRow>
					columns={mockColumns}
					data={mockData}
					i18n={i18n}
					onLoad={onLoad}
					persistenceKey="test-table"
					totalCount={50}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText('Name')).toBeInTheDocument();
			});
		});
	});
});
