import { toast, useToastStore } from '../toastStore';

beforeEach(() => {
  jest.useFakeTimers();
  useToastStore.setState({ toasts: [] });
});
afterEach(() => jest.useRealTimers());

it('mostra uma mensagem e some sozinha após 3,5 s', () => {
  toast('Adicionado à sua lista');
  expect(useToastStore.getState().toasts).toHaveLength(1);
  jest.advanceTimersByTime(3499);
  expect(useToastStore.getState().toasts).toHaveLength(1);
  jest.advanceTimersByTime(1);
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

it('mantém no máximo 3 mensagens na tela', () => {
  ['a', 'b', 'c', 'd', 'e'].forEach((m) => toast(m));
  expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(['c', 'd', 'e']);
});

it('guarda a ação (ex.: "Desfazer") e permite dispensar manualmente', () => {
  const onClick = jest.fn();
  toast('Removido', { label: 'Desfazer', onClick });
  const [t] = useToastStore.getState().toasts;
  expect(t.action?.label).toBe('Desfazer');
  useToastStore.getState().dismiss(t.id);
  expect(useToastStore.getState().toasts).toHaveLength(0);
});
