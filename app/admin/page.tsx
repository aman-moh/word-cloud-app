"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import WordCloud from '@/components/WordCloud'; // Import the custom component
import { WordFrequency, CsvRow } from '@/lib/store'; // Import types

export default function AdminPage() {
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // State for Word Cloud
  const [wordData, setWordData] = useState<WordFrequency[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(true); // Start loading initially

  // State for Word Origin
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [originRows, setOriginRows] = useState<CsvRow[] | null>(null);
  const [isOriginLoading, setIsOriginLoading] = useState<boolean>(false);
  const [originError, setOriginError] = useState<string>('');

  // Fetch initial word cloud data on mount
  useEffect(() => {
    fetchWordCloudData();
  }, []);

  const fetchWordCloudData = async () => {
    setIsCloudLoading(true);
    setWordData([]); // Clear previous data
    try {
      const response = await fetch('/api/wordcloud', { cache: 'no-store' }); // Disable caching
      if (!response.ok) {
        throw new Error(`Failed to fetch word cloud data: ${response.statusText}`);
      }
      const data: WordFrequency[] = await response.json();
      setWordData(data);
    } catch (error) {
      console.error('Error fetching word cloud data:', error);
      // Optionally set an error state to display to the user
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setUploadMessage(''); // Clear previous messages
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUploadMessage('Please select a CSV file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading...');

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadMessage(`File uploaded successfully! ${result.message || ''}`);
        setFile(null); // Clear file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh word cloud data after successful upload
        fetchWordCloudData();
      } else {
        setUploadMessage(`Upload failed: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage(`Upload failed: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setOriginRows(null); // Clear previous results
    setIsOriginLoading(true);
    setOriginError('');
    try {
      const response = await fetch(`/api/admin/word-origin?word=${encodeURIComponent(word)}`);
      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch origin data: ${response.statusText}`);
      }
      const data: CsvRow[] = await response.json();
      setOriginRows(data);
    } catch (error) {
      console.error('Error fetching word origin:', error);
      setOriginError(error instanceof Error ? error.message : 'Could not fetch origin data.');
    } finally {
      setIsOriginLoading(false);
    }
  };

  const clearOriginView = () => {
    setSelectedWord(null);
    setOriginRows(null);
    setOriginError('');
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 md:p-8 lg:p-12 bg-gray-100">
      {/* Upload Section */}
      <div className="w-full max-w-lg p-6 md:p-8 mb-8 bg-white rounded-lg shadow-md">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-center text-gray-800">Admin - Upload & View</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-1">
              Select CSV File:
            </label>
            <input
              type="file"
              id="fileInput"
              accept=".csv,.txt" // Allow txt as per backend logic
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
        {uploadMessage && (
          <p className={`mt-4 text-center text-sm ${uploadMessage.startsWith('Upload failed') ? 'text-red-600' : 'text-green-600'}`}>
            {uploadMessage}
          </p>
        )}
      </div>

      {/* Word Cloud Section */}
      <div className="w-full max-w-3xl p-6 md:p-8 mb-8 bg-white rounded-lg shadow-md">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-center text-gray-700">Word Cloud</h2>
        {isCloudLoading ? (
          <p className="text-center text-gray-500">Loading word cloud...</p>
        ) : (
          <WordCloud data={wordData} onWordClick={handleWordClick} width={600} height={400} />
        )}
      </div>

      {/* Word Origin Section */}
      {selectedWord && (
        <div className="w-full max-w-3xl p-6 md:p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700">
              Rows containing: <span className="font-bold text-indigo-600">{selectedWord}</span>
            </h2>
            <button
              onClick={clearOriginView}
              className="text-sm text-gray-500 hover:text-gray-700"
              aria-label="Close origin view"
            >
              &times; Close
            </button>
          </div>
          {isOriginLoading ? (
            <p className="text-center text-gray-500">Loading origin data...</p>
          ) : originError ? (
             <p className="text-center text-red-600">{originError}</p>
          ) : originRows && originRows.length > 0 ? (
            <div className="overflow-x-auto max-h-60"> {/* Scrollable table */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Dynamically create headers from the first row */}
                    {Object.keys(originRows[0]).map(key => (
                      <th key={key} scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {originRows.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">No matching rows found.</p>
          )}
        </div>
      )}
    </div>
  );
}