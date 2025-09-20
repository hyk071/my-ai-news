/**
 * HighlightText 컴포넌트
 * 검색어와 일치하는 텍스트를 하이라이트 처리
 */

import { useMemo } from 'react';

const HighlightText = ({ 
  text = '', 
  searchQuery = '', 
  className = '',
  highlightClassName = 'highlight',
  caseSensitive = false,
  maxLength = null
}) => {
  // 하이라이트된 텍스트 생성
  const highlightedText = useMemo(() => {
    if (!text || !searchQuery) {
      return maxLength && text.length > maxLength 
        ? text.substring(0, maxLength) + '...'
        : text;
    }

    // 검색어를 공백으로 분리
    const searchTerms = searchQuery
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);

    if (searchTerms.length === 0) {
      return maxLength && text.length > maxLength 
        ? text.substring(0, maxLength) + '...'
        : text;
    }

    let processedText = text;

    // 길이 제한 적용 (하이라이트 전에)
    if (maxLength && processedText.length > maxLength) {
      // 검색어 주변 텍스트를 우선적으로 보여주기
      const firstTermIndex = searchTerms.reduce((minIndex, term) => {
        const index = processedText.toLowerCase().indexOf(term.toLowerCase());
        return index !== -1 && (minIndex === -1 || index < minIndex) ? index : minIndex;
      }, -1);

      if (firstTermIndex !== -1) {
        const start = Math.max(0, firstTermIndex - Math.floor(maxLength / 3));
        const end = Math.min(processedText.length, start + maxLength);
        processedText = (start > 0 ? '...' : '') + 
                      processedText.substring(start, end) + 
                      (end < text.length ? '...' : '');
      } else {
        processedText = processedText.substring(0, maxLength) + '...';
      }
    }

    // 각 검색어에 대해 하이라이트 적용
    searchTerms.forEach((term, index) => {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(`(${escapeRegExp(term)})`, flags);
      
      // 각 검색어마다 다른 하이라이트 클래스 적용 (선택사항)
      const termClass = `${highlightClassName} ${highlightClassName}-${index % 3}`;
      
      processedText = processedText.replace(regex, `<mark class="${termClass}">$1</mark>`);
    });

    return processedText;
  }, [text, searchQuery, caseSensitive, maxLength, highlightClassName]);

  // 정규식 특수문자 이스케이프
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
      style={{
        '--highlight-bg-0': '#fef3c7',
        '--highlight-color-0': '#92400e',
        '--highlight-bg-1': '#dbeafe', 
        '--highlight-color-1': '#1e40af',
        '--highlight-bg-2': '#dcfce7',
        '--highlight-color-2': '#166534'
      }}
    />
  );
};

// 하이라이트 스타일을 위한 CSS
export const HighlightStyles = () => (
  <style jsx global>{`
    .highlight {
      background-color: var(--highlight-bg-0, #fef3c7);
      color: var(--highlight-color-0, #92400e);
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: 600;
    }

    .highlight-0 {
      background-color: var(--highlight-bg-0, #fef3c7);
      color: var(--highlight-color-0, #92400e);
    }

    .highlight-1 {
      background-color: var(--highlight-bg-1, #dbeafe);
      color: var(--highlight-color-1, #1e40af);
    }

    .highlight-2 {
      background-color: var(--highlight-bg-2, #dcfce7);
      color: var(--highlight-color-2, #166534);
    }

    /* 다크 모드 지원 */
    @media (prefers-color-scheme: dark) {
      .highlight {
        background-color: #fbbf24;
        color: #1f2937;
      }

      .highlight-0 {
        background-color: #fbbf24;
        color: #1f2937;
      }

      .highlight-1 {
        background-color: #60a5fa;
        color: #1f2937;
      }

      .highlight-2 {
        background-color: #4ade80;
        color: #1f2937;
      }
    }

    /* 애니메이션 효과 */
    .highlight {
      animation: highlightFade 0.3s ease-in-out;
    }

    @keyframes highlightFade {
      0% {
        background-color: transparent;
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }
  `}</style>
);

export default HighlightText;