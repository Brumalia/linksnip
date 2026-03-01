"use client";

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setShortUrl(''); // Clear previous results
    setError(''); // Clear previous errors
    setCopying(false); // Reset copy state

    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong shortening the URL.');
      }

      setShortUrl(data.shortUrl); // Assuming the API returns { shortUrl: '...' }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopying(true);
      setTimeout(() => {
        setCopying(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setError('Failed to copy URL. Please copy it manually.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">LinkSnip</h1>
        <h2 className="text-xl text-gray-600 mb-8">Simple URL shortener</h2>

        <form onSubmit={handleShorten} className="space-y-6">
          <div>
            <input
              type="url" // Use type="url" for better mobile keyboards and validation
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm"
              required // Add required for basic browser validation
              aria-label="Long URL" // Accessibility
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md
                       sm:w-auto sm:inline-block" // Full width on mobile, auto on wider screens
          >
            Shorten URL
          </button>
        </form>

        {(shortUrl || error) && (
          <div className="mt-8">
            {error && (
              <p className="text-red-500 text-lg mb-4">{error}</p>
            )}
            {shortUrl && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center justify-between" role="alert">
                <span className="block sm:inline mr-4">
                  <strong className="font-bold">Short URL:</strong>
                  <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                    {shortUrl}
                  </a>
                </span>
                <button
                  onClick={handleCopy}
                  disabled={copying}
                  className={`ml-auto px-3 py-2 rounded text-white font-semibold transition-colors duration-200
                            ${copying ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {copying ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
