import * as Icons from '@mui/icons-material';
import { IconButton, Modal } from '@mui/material';
import React from 'react';

interface ImageModalProps {
	imageUrl: string;
	isOpen: boolean;
	onClose: () => void;
}

export function ImageModal({ imageUrl, isOpen, onClose }: ImageModalProps): React.ReactElement {
	return (
		<Modal
			open={isOpen}
			onClose={onClose}
			sx={{
				alignItems: 'center',
				display: 'flex',
				justifyContent: 'center',
				p: 2,
			}}
		>
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: 8,
					boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
					maxHeight: '90vh',
					maxWidth: '90vw',
					overflow: 'auto',
					position: 'relative',
				}}
			>
				<IconButton
					onClick={onClose}
					sx={{
						'&:hover': {
							backgroundColor: 'rgba(0,0,0,0.7)',
						},
						backgroundColor: 'rgba(0,0,0,0.5)',
						color: 'white',
						position: 'absolute',
						right: 8,
						top: 8,
					}}
				>
					<Icons.Close />
				</IconButton>
				{imageUrl && (
					<img
						alt="Beverage Full Size"
						src={imageUrl}
						style={{
							display: 'block',
							height: 'auto',
							maxHeight: '90vh',
							maxWidth: '90vw',
							width: 'auto',
						}}
					/>
				)}
			</div>
		</Modal>
	);
}
