import { render, screen } from '../test-utils/testUtils.js';
import { ImageModal } from './ImageModal.js';
import React from 'react';
import { userEvent } from '@testing-library/user-event';

describe('ImageModal', () => {
	it('should not display modal when isOpen is false', () => {
		render(<ImageModal imageUrl="test.jpg" isOpen={false} onClose={() => {}} />);
		expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
	});

	it('should display modal when isOpen is true', () => {
		render(<ImageModal imageUrl="test.jpg" isOpen={true} onClose={() => {}} />);
		expect(screen.getByRole('presentation')).toBeInTheDocument();
	});

	it('should render image with correct src when imageUrl is provided', () => {
		render(<ImageModal imageUrl="https://example.com/image.jpg" isOpen={true} onClose={() => {}} />);
		const img = screen.getByAltText('Beverage Full Size') as HTMLImageElement;
		expect(img).toBeInTheDocument();
		expect(img.src).toBe('https://example.com/image.jpg');
	});

	it('should render close button', () => {
		render(<ImageModal imageUrl="test.jpg" isOpen={true} onClose={() => {}} />);
		const closeButton = screen.getByRole('button');
		expect(closeButton).toBeInTheDocument();
	});

	it('should call onClose when close button is clicked', async () => {
		const onClose = jest.fn();
		const user = userEvent.setup();
		render(<ImageModal imageUrl="test.jpg" isOpen={true} onClose={onClose} />);

		const closeButton = screen.getByRole('button');
		await user.click(closeButton);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should call onClose when backdrop is clicked', async () => {
		const onClose = jest.fn();
		const user = userEvent.setup();
		render(<ImageModal imageUrl="test.jpg" isOpen={true} onClose={onClose} />);

		const backdrop = screen.getByRole('presentation').firstChild as HTMLElement;
		await user.click(backdrop);

		expect(onClose).toHaveBeenCalled();
	});

	it('should not render image when imageUrl is empty', () => {
		render(<ImageModal imageUrl="" isOpen={true} onClose={() => {}} />);
		expect(screen.queryByAltText('Beverage Full Size')).not.toBeInTheDocument();
	});

	it('should update imageUrl when prop changes', () => {
		const { rerender } = render(<ImageModal imageUrl="image1.jpg" isOpen={true} onClose={() => {}} />);

		let img = screen.getByAltText('Beverage Full Size') as HTMLImageElement;
		expect(img.src).toContain('image1.jpg');

		rerender(<ImageModal imageUrl="image2.jpg" isOpen={true} onClose={() => {}} />);

		img = screen.getByAltText('Beverage Full Size') as HTMLImageElement;
		expect(img.src).toContain('image2.jpg');
	});

	it('should have correct modal styling', () => {
		render(<ImageModal imageUrl="test.jpg" isOpen={true} onClose={() => {}} />);
		const modal = screen.getByRole('presentation');

		// Modal should exist with proper structure
		expect(modal).toBeInTheDocument();
	});

	it('should render image with correct alt text', () => {
		render(<ImageModal imageUrl="test.jpg" isOpen={true} onClose={() => {}} />);
		expect(screen.getByAltText('Beverage Full Size')).toBeInTheDocument();
	});
});
