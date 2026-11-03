import { Box, Checkbox, Stack, TextField } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Column, DataTable, DateField, LoadParams, NumberField, StringKeyOf, Thumbnail } from '../src/index.ts';

type Row = { Extra: string; ImageUrl: string; Text: string; Value: number };
const TotalRows = 100;
const TestImageSize = 500;
const TestImageVariation = 200;
const TestExtraWords = 20;
const TestExtraWordLength = 25;

function App(): React.ReactElement {
	const [date, setDate] = useState<string | undefined>(new Date().toISOString());
	const [timeZone, setTimeZone] = useState('Asia/Tokyo');
	const [number, setNumber] = useState(0);
	const [isEmpty, setIsEmpty] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [scrollInternally, setScrollInternally] = useState(true);

	const [rows, setRows] = useState<Row[]>([]);

	const columns: Column<Row>[] = [
		{
			isSortable: true,
			key: 'Text',
			label: 'Name',
			render: row => (
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
					<Thumbnail
						imageUrl={row.ImageUrl}
						sx={{
							'& img': { height: '100%', objectFit: 'cover', width: '100%' },
							border: 'solid 1px',
							borderColor: 'divider',
							borderRadius: 1,
							boxSizing: 'border-box',
							overflow: 'hidden',
							width: 48,
						}}
					/>
					<span>
						{row.Text} {row.Extra}
					</span>
				</Stack>
			),
			size: 'fill',
		},
		{
			align: 'right',
			isSortable: true,
			key: 'Value',
			label: 'Amount',
			render: row => <Box sx={{ border: 'solid 1px', paddingY: '1em' }}>{row.Value}</Box>,
			size: 'minimum',
		},
	];

	const createRow = (index: number): Row => {
		const getSize = (): number =>
			Math.floor(Math.random() * 2 * TestImageVariation - TestImageVariation + TestImageSize);
		return {
			Extra: Array.from({ length: Math.floor(Math.random() * TestExtraWords + 1) })
				.map(() => '#'.repeat(Math.floor(Math.random() * TestExtraWordLength + 1)))
				.join(' '),
			ImageUrl: `https://picsum.photos/seed/${index + 1}/${getSize()}/${getSize()}`,
			Text: `foo_${index}`,
			Value: index,
		};
	};

	const loadData = useCallback(
		(params: LoadParams<StringKeyOf<Row>>): void => {
			const start = (params.currentPage - 1) * params.pageSize;
			void new Promise(() => {
				setIsLoading(true);
				setTimeout(() => {
					if (isEmpty) {
						setRows([]);
					} else if (params.showAll) {
						setRows(Array.from({ length: TotalRows }).map((_, i) => createRow(i)));
					} else {
						setRows(Array.from({ length: params.pageSize }).map((_, i) => createRow(i + start)));
					}
					setIsLoading(false);
				}, 1000);
			});
		},
		[isEmpty],
	);

	return (
		<Stack
			spacing={1}
			sx={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}
		>
			<h1>React Library Test Page</h1>
			<h2>DataTable</h2>
			<DataTable<Row>
				columns={columns}
				getRowKey={row => row.Text}
				initialPageSize={5}
				isLoading={isLoading}
				onLoad={loadData}
				persistenceKey="demo"
				rows={rows}
				scrollInternally={scrollInternally}
				totalCount={100}
			/>
			<Stack direction="row" sx={{ justifyContent: 'space-between', width: '100%' }}>
				<Stack direction="row" sx={{ alignItems: 'center' }}>
					Is Loading <Checkbox checked={isLoading} onChange={e => setIsLoading(e.target.checked)} />{' '}
				</Stack>
				<Stack direction="row" sx={{ alignItems: 'center' }}>
					Is Empty <Checkbox checked={isEmpty} onChange={e => setIsEmpty(e.target.checked)} />{' '}
				</Stack>
				<Stack direction="row" sx={{ alignItems: 'center' }}>
					Scroll Internally{' '}
					<Checkbox checked={scrollInternally} onChange={e => setScrollInternally(e.target.checked)} />{' '}
				</Stack>
			</Stack>
			<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
				<h2>DateField</h2>
				<DateField onChange={val => setDate(val)} timeZone={timeZone} value={date} />
				<TextField
					label="Time Zone"
					onChange={e => setTimeZone(e.target.value)}
					placeholder="Asia/Tokyo"
					size="small"
					value={timeZone}
				/>
				<Box sx={{ color: 'text.secondary' }}>UTC: {date ?? '(none)'}</Box>
			</Stack>
			<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
				<h2>NumberField</h2>
				<NumberField onChange={setNumber} value={number} />
			</Stack>
		</Stack>
	);
}

export default App;
