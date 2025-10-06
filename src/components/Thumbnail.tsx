import * as Icons from '@mui/icons-material';
import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { ImageModal } from './ImageModal';

interface ThumbnailProps {
	alt?: string;
	imageUrl?: string;
}

export interface ThumbnailRef {
	openImage: (imageUrl: string) => void;
}

export function Thumbnail({ alt = 'Thumbnail', imageUrl }: ThumbnailProps): React.ReactElement {
	const [imageModalState, setImageModalState] = useState<{
		imageUrl: string;
		isOpen: boolean;
	}>({
		imageUrl: '',
		isOpen: false,
	});

	const handleImageClick = useCallback((url: string, e: React.MouseEvent): void => {
		e.stopPropagation();
		if (url) {
			setImageModalState({
				imageUrl: url,
				isOpen: true,
			});
		}
	}, []);

	const handleCloseImageModal = useCallback((): void => {
		setImageModalState({
			imageUrl: '',
			isOpen: false,
		});
	}, []);

	return (
		<>
			<Box
				sx={{
					alignContent: 'center',
					alignItems: 'center',
					border: imageUrl ? 'none' : 'solid 2px red',
					borderRadius: '5px',
					display: 'flex',
					justifyContent: 'center',
					maxWidth: '2em !important',
					minWidth: '2em !important',
					overflow: 'hidden',
				}}
			>
				{imageUrl ? (
					<img
						alt={alt}
						onClick={e => handleImageClick(imageUrl, e)}
						src={imageUrl}
						style={{
							alignSelf: 'center',
							cursor: 'pointer',
							maxHeight: '100%',
							maxWidth: '100%',
						}}
					/>
				) : (
					<Box
						sx={{
							alignItems: 'center',
							display: 'flex',
							height: '100%',
							justifyContent: 'center',
							padding: '0.5em 0',
							width: '100%',
						}}
					>
						<Icons.AddPhotoAlternate />
					</Box>
				)}
			</Box>
			<ImageModal
				imageUrl={imageModalState.imageUrl}
				isOpen={imageModalState.isOpen}
				onClose={handleCloseImageModal}
			/>
		</>
	);
}
