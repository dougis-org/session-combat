'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { FeedbackForm, FeedbackFormData } from './FeedbackForm';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultState = 'idle' | 'success' | 'error';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const submitSeqRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setResult('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  function handleClose() {
    submitSeqRef.current++;
    if (result !== 'success') {
      setResult('idle');
      setErrorMessage('');
    }
    onClose();
  }

  async function handleSubmit(data: FeedbackFormData) {
    const seq = ++submitSeqRef.current;
    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (submitSeqRef.current !== seq) return;

      if (response.status === 201) {
        setResult('success');
      } else {
        const body = await response.json().catch(() => ({})) as { error?: string };
        setErrorMessage(body.error ?? 'Something went wrong. Please try again.');
        setResult('error');
      }
    } catch {
      if (submitSeqRef.current !== seq) return;
      setErrorMessage('Network error. Please check your connection and try again.');
      setResult('error');
    } finally {
      if (submitSeqRef.current === seq) setSubmitting(false);
    }
  }

  function handleRetry() {
    setResult('idle');
    setErrorMessage('');
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Send Feedback"
      onClose={handleClose}
      size="medium"
    >
      {result === 'success' && (
        <div className="flex flex-col gap-4 items-center text-center">
          <p className="text-green-400 text-lg font-medium">Thank you for your feedback!</p>
          <p className="text-gray-300 text-sm">Your report has been submitted and a GitHub issue has been created.</p>
          <button
            onClick={handleClose}
            className="py-2 px-6 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {result === 'error' && (
        <div className="flex flex-col gap-4">
          <p className="text-red-400 text-sm">{errorMessage}</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleClose}
              className="py-2 px-4 rounded text-sm text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleRetry}
              className="py-2 px-4 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {result === 'idle' && (
        <FeedbackForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={submitting}
        />
      )}
    </Modal>
  );
}
