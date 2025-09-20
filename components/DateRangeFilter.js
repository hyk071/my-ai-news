/**
 * DateRangeFilter 컴포넌트
 * 시작 날짜와 종료 날짜를 선택할 수 있는 날짜 범위 필터
 */

import { useState, useEffect, useCallback } from 'react';

const DateRangeFilter = ({
  startDate = '',
  endDate = '',
  onChange,
  minDate = '',
  maxDate = '',
  className = '',
  disabled = false
}) => {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [error, setError] = useState('');

  // 날짜 유효성 검증
  const validateDates = useCallback((startValue, endValue) => {
    setError('');

    if (!startValue && !endValue) {
      return true; // 둘 다 비어있으면 유효
    }

    if (startValue && endValue) {
      const startDateObj = new Date(startValue);
      const endDateObj = new Date(endValue);

      if (startDateObj > endDateObj) {
        setError('시작 날짜가 종료 날짜보다 늦을 수 없습니다.');
        return false;
      }
    }

    // 최소/최대 날짜 검증
    if (minDate && startValue) {
      const minDateObj = new Date(minDate);
      const startDateObj = new Date(startValue);
      if (startDateObj < minDateObj) {
        setError(`시작 날짜는 ${formatDate(minDate)} 이후여야 합니다.`);
        return false;
      }
    }

    if (maxDate && endValue) {
      const maxDateObj = new Date(maxDate);
      const endDateObj = new Date(endValue);
      if (endDateObj > maxDateObj) {
        setError(`종료 날짜는 ${formatDate(maxDate)} 이전이어야 합니다.`);
        return false;
      }
    }

    return true;
  }, [minDate, maxDate]);

  // 날짜 변경 처리
  const handleStartDateChange = useCallback((e) => {
    const newStart = e.target.value;
    setStart(newStart);

    if (validateDates(newStart, end)) {
      onChange && onChange({
        start: newStart,
        end: end
      });
    }
  }, [end, onChange, validateDates]);

  const handleEndDateChange = useCallback((e) => {
    const newEnd = e.target.value;
    setEnd(newEnd);

    if (validateDates(start, newEnd)) {
      onChange && onChange({
        start: start,
        end: newEnd
      });
    }
  }, [start, onChange, validateDates]);

  // 프리셋 날짜 범위
  const presets = [
    {
      label: '오늘',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
      }
    },
    {
      label: '최근 7일',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: '최근 30일',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: '이번 달',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    }
  ];

  // 프리셋 적용
  const applyPreset = useCallback((preset) => {
    const { start: newStart, end: newEnd } = preset.getValue();
    setStart(newStart);
    setEnd(newEnd);
    setError('');
    
    onChange && onChange({
      start: newStart,
      end: newEnd
    });
  }, [onChange]);

  // 초기화
  const handleReset = useCallback(() => {
    setStart('');
    setEnd('');
    setError('');
    
    onChange && onChange({
      start: '',
      end: ''
    });
  }, [onChange]);

  // 날짜 포맷팅
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  }

  // 외부에서 props가 변경될 때 내부 상태 업데이트
  useEffect(() => {
    setStart(startDate);
    setEnd(endDate);
  }, [startDate, endDate]);

  return (
    <div className={`date-range-filter ${className}`}>
      <div className="filter-header">
        <h3 className="filter-title">날짜 범위</h3>
        {(start || end) && (
          <button 
            className="reset-button"
            onClick={handleReset}
            disabled={disabled}
            type="button"
          >
            초기화
          </button>
        )}
      </div>

      {/* 프리셋 버튼들 */}
      <div className="presets">
        {presets.map((preset, index) => (
          <button
            key={index}
            className="preset-button"
            onClick={() => applyPreset(preset)}
            disabled={disabled}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 날짜 입력 필드들 */}
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date" className="date-label">
            시작 날짜
          </label>
          <input
            id="start-date"
            type="date"
            className="date-input"
            value={start}
            onChange={handleStartDateChange}
            min={minDate}
            max={end || maxDate}
            disabled={disabled}
          />
        </div>

        <div className="date-separator">~</div>

        <div className="date-input-group">
          <label htmlFor="end-date" className="date-label">
            종료 날짜
          </label>
          <input
            id="end-date"
            type="date"
            className="date-input"
            value={end}
            onChange={handleEndDateChange}
            min={start || minDate}
            max={maxDate}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* 선택된 범위 표시 */}
      {(start || end) && !error && (
        <div className="selected-range">
          <svg className="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            {start ? formatDate(start) : '시작일 미지정'} ~ {end ? formatDate(end) : '종료일 미지정'}
          </span>
        </div>
      )}

      <style jsx>{`
        .date-range-filter {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .filter-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .reset-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .reset-button:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        .reset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .presets {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .preset-button {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          color: #374151;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-button:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .preset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .date-inputs {
          display: flex;
          align-items: end;
          gap: 12px;
          margin-bottom: 16px;
        }

        .date-input-group {
          flex: 1;
        }

        .date-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .date-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .date-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .date-input:disabled {
          background: #f9fafb;
          opacity: 0.6;
          cursor: not-allowed;
        }

        .date-separator {
          font-size: 18px;
          font-weight: 500;
          color: #6b7280;
          padding: 0 4px;
          margin-bottom: 8px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .error-icon {
          width: 16px;
          height: 16px;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .selected-range {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          color: #0369a1;
          font-size: 14px;
        }

        .calendar-icon {
          width: 16px;
          height: 16px;
          stroke-width: 2;
          flex-shrink: 0;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .date-inputs {
            flex-direction: column;
            gap: 16px;
          }

          .date-separator {
            align-self: center;
            margin: 0;
          }

          .presets {
            gap: 6px;
          }

          .preset-button {
            font-size: 12px;
            padding: 5px 10px;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .date-range-filter {
            background: #1f2937;
            border-color: #374151;
          }

          .filter-title {
            color: #f9fafb;
          }

          .reset-button {
            color: #9ca3af;
          }

          .reset-button:hover:not(:disabled) {
            background: #374151;
            color: #d1d5db;
          }

          .preset-button {
            background: #374151;
            border-color: #4b5563;
            color: #d1d5db;
          }

          .preset-button:hover:not(:disabled) {
            background: #4b5563;
            border-color: #6b7280;
          }

          .date-label {
            color: #d1d5db;
          }

          .date-input {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .date-input:focus {
            border-color: #60a5fa;
          }

          .date-separator {
            color: #9ca3af;
          }

          .selected-range {
            background: #1e3a8a;
            border-color: #3b82f6;
            color: #bfdbfe;
          }
        }
      `}</style>
    </div>
  );
};

export default DateRangeFilter;