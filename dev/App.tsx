import { Box, Checkbox, Stack } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Column, DataTable, DateField, LoadParams, NumberField, Thumbnail } from '../src/index.ts';

type Row = { Text: string; Value: number };
const TotalRows = 100;
const TestImageSize = 500;
const TestImageVariation = 200;
const TestExtraWords = 20;
const TestExtraWordLength = 25;

function App(): React.ReactElement {
	const [date, setDate] = useState<string | undefined>(new Date().toISOString());
	const [number, setNumber] = useState(0);
	const [isEmpty, setIsEmpty] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [data, setData] = useState<(React.ReactElement | string)[][]>([]);

	const columns: Column<Row>[] = [
		{ isSortable: true, key: 'Text', label: 'Name', size: 'fill' },
		{ align: 'right', isSortable: true, key: 'Value', label: 'Amount', size: 'minimum' },
	];

	const createNameCell = (index: number): React.ReactElement => {
		const getSize = (): number =>
			Math.floor(Math.random() * 2 * TestImageVariation - TestImageVariation + TestImageSize);
		const getExtra = (): string =>
			Array.from({ length: Math.floor(Math.random() * TestExtraWords + 1) })
				.map(() => '#'.repeat(Math.floor(Math.random() * TestExtraWordLength + 1)))
				.join(' ');
		return (
			<Stack alignItems="center" direction="row" spacing={1} sx={{ height: '100%' }}>
				<Thumbnail
					imageUrl={`https://picsum.photos/seed/${index + 1}/${getSize()}/${getSize()}`}
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
					foo_{index} {getExtra()}
				</span>
			</Stack>
		);
	};

	const loadData = useCallback(
		(params: LoadParams<Row>): void => {
			const start = (params.currentPage - 1) * params.pageSize;
			void new Promise(() => {
				setIsLoading(true);
				setTimeout(() => {
					if (isEmpty) {
						setData([]);
					} else if (params.showAll) {
						setData(Array.from({ length: TotalRows }).map((_, i) => [createNameCell(i), `${i}`]));
					} else {
						setData(
							Array.from({ length: params.pageSize }).map((_, i) => [
								createNameCell(i + start),
								<Box sx={{ border: 'solid 1px', paddingY: '1em' }}>{i + start}</Box>,
							]),
						);
					}
					setIsLoading(false);
				}, 1000);
			});
		},
		[isEmpty],
	);

	return (
		<div style={{ padding: '20px' }}>
			<h1>React Library Test Page</h1>
			<h2>DataTable</h2>
			<DataTable<Row>
				columns={columns}
				data={data}
				initialPageSize={5}
				isLoading={isLoading}
				onLoad={loadData}
				totalCount={100}
			/>
			<Stack direction="row" justifyContent="space-between" width="100%">
				<Stack alignItems="center" direction="row">
					Is Loading <Checkbox checked={isLoading} onChange={e => setIsLoading(e.target.checked)} />{' '}
				</Stack>
				<Stack alignItems="center" direction="row">
					Is Empty <Checkbox checked={isEmpty} onChange={e => setIsEmpty(e.target.checked)} />{' '}
				</Stack>
			</Stack>
			<h2>DateField</h2>
			<DateField onChange={val => setDate(val)} value={date} />
			<h2>NumberField</h2>
			<NumberField onChange={setNumber} value={number} />
		</div>
	);
}

export default App;
