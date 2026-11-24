import { act, fireEvent, render, screen } from '@testing-library/react';
import AccountButton from '../layout/AccountButton';
import { useAuthStore } from '../../store/authStore';

jest.mock('../../lib/firebase', () => ({ isFirebaseConfigured: () => true, loadFirebase: jest.fn() }));

const signIn = jest.fn().mockResolvedValue(undefined);
const signOut = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ status: 'signedOut', user: null, sync: 'idle', signIn, signOut });
});

it('não aparece quando o login não está configurado', () => {
  useAuthStore.setState({ status: 'disabled' });
  const { container } = render(<AccountButton />);
  expect(container).toBeEmptyDOMElement();
});

it('deslogado: botão "Entrar" abre o login do Google', async () => {
  render(<AccountButton />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Entrar' })));
  expect(signIn).toHaveBeenCalled();
});

it('logado: menu com nome, e-mail, atalho para a lista e "Sair"', () => {
  useAuthStore.setState({ status: 'signedIn', user: { uid: 'u1', name: 'Ana', email: 'ana@exemplo.com', photo: null } });
  render(<AccountButton />);

  const trigger = screen.getByRole('button', { name: 'Conta de Ana' });
  expect(trigger).toHaveTextContent('A');
  fireEvent.click(trigger);
  expect(screen.getByRole('menu')).toHaveTextContent('ana@exemplo.com');
  expect(screen.getByRole('menuitem', { name: /Minha lista/ })).toHaveAttribute('href', '/favorites');

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();

  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('menuitem', { name: /Sair/ }));
  expect(signOut).toHaveBeenCalled();
});
