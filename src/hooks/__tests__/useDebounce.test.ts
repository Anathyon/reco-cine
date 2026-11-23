import { act, renderHook } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('só entrega o valor depois que o usuário para de digitar', () => {
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: 'd' } });
  rerender({ v: 'du' });
  act(() => jest.advanceTimersByTime(200));
  rerender({ v: 'dun' });
  act(() => jest.advanceTimersByTime(200));
  expect(result.current).toBe('d');

  act(() => jest.advanceTimersByTime(100));
  expect(result.current).toBe('dun');
});
