import React from 'react';
import { CampaignChapter } from '@/lib/types';

interface Props {
  chapters: CampaignChapter[];
  currentChapterId?: string;
}

export function CampaignChapterInfo({ chapters, currentChapterId }: Props) {
  const currentChapter = currentChapterId
    ? chapters.find(ch => ch.id === currentChapterId)
    : undefined;

  return (
    <p className="text-gray-400 text-sm mt-1">
      {currentChapter ? currentChapter.title : 'No chapter set'}
    </p>
  );
}
