import { Box, SxProps, Theme } from '@mui/material';
import * as Icons from '@mui/icons-material';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { ImageModal } from './ImageModal.js';

export interface ThumbnailRef {
	openImage: (imageUrl: string) => void;
}

interface ThumbnailProps {
	alt?: string;
	imageUrl?: string;
	noImageIcon?: ReactNode | undefined;
	onImageClick?: ((imageUrl: string, event: React.MouseEvent<HTMLElement, MouseEvent>) => void) | null | undefined;
	onNoImageClick?: React.MouseEventHandler<HTMLElement> | undefined;
	sx?: SxProps<Theme> | undefined;
}

export function Thumbnail({
	alt = 'Thumbnail',
	imageUrl,
	noImageIcon,
	onImageClick,
	onNoImageClick,
	sx,
}: ThumbnailProps): React.ReactElement {
	const ref = useRef<HTMLDivElement>(null);
	const [imageHeight, setImageHeight] = useState<number>(1);
	const [imageModalState, setImageModalState] = useState<{ imageUrl: string; isOpen: boolean }>({
		imageUrl: '',
		isOpen: false,
	});

	useEffect(() => {
		const updateImageHeight = (): void => {
			if (ref.current) {
				const sibling = ref.current.parentElement;
				if (sibling) {
					const { height } = sibling.getBoundingClientRect();
					setImageHeight(height);
				}
			}
		};

		updateImageHeight();
		const resizeObserver = new ResizeObserver(updateImageHeight);
		if (ref.current) {
			resizeObserver.observe(ref.current);
		}
		return (): void => resizeObserver.disconnect();
	}, []);

	const handleImageClick =
		onImageClick === null
			? null
			: (onImageClick ??
				useCallback((url: string, e: React.MouseEvent): void => {
					e.stopPropagation();
					if (url) {
						setImageModalState({
							imageUrl: url,
							isOpen: true,
						});
					}
				}, []));

	const handleCloseImageModal = useCallback((): void => {
		setImageModalState({
			imageUrl: '',
			isOpen: false,
		});
	}, []);

	return (
		<>
			<Box
				ref={ref}
				sx={{
					alignContent: 'center',
					alignItems: 'center',
					border: imageUrl ? 'none' : 'solid 2px red',
					borderRadius: '5px',
					display: 'flex',
					height: `${imageHeight}px`,
					justifyContent: 'center',
					maxHeight: `${imageHeight}px`,
					overflow: 'hidden',
					width: '2em',
					...sx,
				}}
			>
				{imageUrl ? (
					<img
						alt={alt}
						onClick={e => handleImageClick?.(imageUrl, e)}
						src={imageUrl}
						style={{
							alignSelf: 'center',
							cursor: handleImageClick === null ? 'unset' : 'pointer',
							maxWidth: '100%',
							objectFit: 'cover',
						}}
					/>
				) : (
					<Box
						onClick={e => onNoImageClick?.(e)}
						sx={{
							alignItems: 'center',
							cursor: onNoImageClick ? 'pointer' : 'unset',
							display: 'flex',
							height: '100%',
							justifyContent: 'center',
							padding: '0.5em 0',
							width: '100%',
						}}
					>
						{noImageIcon ?? <Icons.AddPhotoAlternate />}
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
