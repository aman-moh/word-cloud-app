import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Ensure matchers are available
import AdminPage from '../page';
import { WordFrequency, CsvRow } from '@/lib/store';

// Mock the WordCloud component
jest.mock('@/components/WordCloud', () => {
  // eslint-disable-next-line react/display-name
  return ({ data, onWordClick }: { data: WordFrequency[], onWordClick: (word: string) => void }) => (
    <div data-testid="mock-wordcloud">
      {data.map(word => (
        <button key={word.text} onClick={() => onWordClick(word.text)} data-testid={`word-${word.text}`}>
          {word.text} ({word.value})
        </button>
      ))}
    </div>
  );
});

// Mock data
const mockWordCloudData: WordFrequency[] = [
  { text: 'test', value: 10 },
  { text: 'cloud', value: 5 },
];
const mockOriginData: CsvRow[] = [
  { ID: '1', Responses: 'This is a test response.', Other: 'abc' },
  { ID: '3', Responses: 'Another test here.', Other: 'def' },
];

// Setup fetch mock
global.fetch = jest.fn();

// Corrected mockFetch implementation with delays and fixed URL parsing
const mockFetch = (url: string | URL | Request, options?: RequestInit) => {
  const urlString = url.toString();
  console.log(`Mock Fetch Called: ${urlString}`); // Add logging

  if (urlString.includes('/api/wordcloud')) {
    return new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve(mockWordCloudData),
    }), 10));
  }
  if (urlString.includes('/api/admin/upload') && options?.method === 'POST') {
    return new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Mock upload success' }),
    }), 10));
  }
  if (urlString.startsWith('/api/admin/word-origin')) {
     // Correctly parse query param from relative URL string
     const params = new URLSearchParams(urlString.split('?')[1] || '');
     const word = params.get('word');
     console.log(`Mock Fetch Origin Word: ${word}`); // Add logging
     if (word === 'test') {
        return new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockOriginData),
        }), 10));
     } else {
         return new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve([]), // Return empty for other words
        }), 10));
     }
  }
  // Default fallback with delay
  return new Promise(resolve => setTimeout(() => resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: 'Not Found' }) }), 10));
};


describe('AdminPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (fetch as jest.Mock).mockImplementation(mockFetch);
    jest.clearAllMocks();
  });

  it('renders initial state with loading message', () => {
    render(<AdminPage />);
    expect(screen.getByRole('heading', { name: /admin - upload & view/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/select csv file:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload file/i })).toBeDisabled();
    expect(screen.getByText(/loading word cloud.../i)).toBeInTheDocument();
  });

  it('fetches and displays word cloud data on mount', async () => {
    render(<AdminPage />);

    // Wait for loading to finish and data to appear
    await waitFor(() => {
      expect(screen.queryByText(/loading word cloud.../i)).not.toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/wordcloud');
    expect(screen.getByTestId('mock-wordcloud')).toBeInTheDocument();
    expect(screen.getByText('test (10)')).toBeInTheDocument();
    expect(screen.getByText('cloud (5)')).toBeInTheDocument();
  });

   it('handles CSV upload successfully and refreshes word cloud', async () => {
    render(<AdminPage />);

    // Wait for initial cloud load
    await waitFor(() => expect(screen.queryByText(/loading word cloud.../i)).not.toBeInTheDocument());

    const fileInput = screen.getByLabelText(/select csv file:/i);
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    const file = new File(['col1,Responses\nval1,test data'], 'test.csv', { type: 'text/csv' });

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(uploadButton).toBeEnabled();

    // Simulate clicking the submit button
    fireEvent.click(uploadButton);

    // Wait for upload to complete and success message to appear
    await waitFor(() => {
      expect(screen.getByText(/file uploaded successfully! mock upload success/i)).toBeInTheDocument();
    });

    // Check fetch calls: initial load, upload, refresh load
    // Use waitFor to ensure all async calls triggered by the upload are counted
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(fetch).toHaveBeenCalledWith('/api/wordcloud'); // Initial
    expect(fetch).toHaveBeenCalledWith('/api/admin/upload', expect.objectContaining({ method: 'POST' })); // Upload
    expect(fetch).toHaveBeenCalledWith('/api/wordcloud'); // Refresh
  });

  it('handles word click, fetches origin data, and displays it', async () => {
    render(<AdminPage />);

    // Wait for initial cloud load
    await waitFor(() => expect(screen.queryByText(/loading word cloud.../i)).not.toBeInTheDocument());

    // Find and click a word in the mocked cloud
    const wordButton = screen.getByTestId('word-test');
    fireEvent.click(wordButton);

    // Check for loading state and selected word display
    // Use findBy queries which automatically wait for the element to appear
    await screen.findByText(/loading origin data.../i);
    expect(screen.getByRole('heading', { name: /rows containing: test/i })).toBeInTheDocument();

    // Wait for origin data fetch and display
    await waitFor(() => {
      expect(screen.queryByText(/loading origin data.../i)).not.toBeInTheDocument();
    });

    // Check fetch call for origin data
    expect(fetch).toHaveBeenCalledWith('/api/admin/word-origin?word=test');

    // Check if origin data table is displayed
    // Use findByRole to wait for the table to appear after data loading
    await screen.findByRole('table');
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Responses' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'This is a test response.' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Another test here.' })).toBeInTheDocument();
  });

   it('closes the origin view when close button is clicked', async () => {
    render(<AdminPage />);

    // Load cloud and click word
    await waitFor(() => expect(screen.queryByText(/loading word cloud.../i)).not.toBeInTheDocument());
    fireEvent.click(screen.getByTestId('word-test'));

    // Wait for the table to appear
    await screen.findByRole('table');

    // Ensure origin view is visible
    expect(screen.getByRole('heading', { name: /rows containing: test/i })).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close origin view/i });
    fireEvent.click(closeButton);

    // Check that origin view is removed
    // Use waitFor to ensure assertions run after the state update from clicking 'close'
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /rows containing: test/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

});