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
				const parent = ref.current.parentElement;
				if (parent) {
					// Temporarily collapse so the parent can shrink to its natural height
					ref.current.style.height = '0px';
					ref.current.style.maxHeight = '0px';
					const { height } = parent.getBoundingClientRect();
					ref.current.style.height = '';
					ref.current.style.maxHeight = '';
					setImageHeight(height);
				}
			}
		};

		updateImageHeight();
		const resizeObserver = new ResizeObserver(updateImageHeight);
		const parent = ref.current?.parentElement;
		if (parent) {
			resizeObserver.observe(parent);
		}
		window.addEventListener('resize', updateImageHeight);
		return (): void => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateImageHeight);
		};
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
					flexShrink: 0,
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
