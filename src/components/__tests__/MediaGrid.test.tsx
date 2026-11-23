import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import MediaGrid from '../media/MediaGrid';
import { EmptyState } from '../ui/States';
import { makeItem, makeRouter } from '../../test/utils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
beforeEach(() => (useRouter as jest.Mock).mockReturnValue(makeRouter()));

const items = [makeItem({ id: 1, title: 'Um' }), makeItem({ id: 2, title: 'Dois' })];

it('renderiza um card por item', () => {
  render(<MediaGrid items={items} />);
  expect(screen.getAllByRole('article')).toHaveLength(2);
});

it('mostra skeletons enquanto carrega a primeira página', () => {
  const { container } = render(<MediaGrid items={[]} loading skeletonCount={5} />);
  expect(container.querySelectorAll('[aria-hidden="true"] .skeleton.aspect-\\[2\\/3\\]')).toHaveLength(5);
});

it('mostra o erro com botão de tentar novamente', () => {
  const onRetry = jest.fn();
  render(<MediaGrid items={items} error="Sem conexão" onRetry={onRetry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(onRetry).toHaveBeenCalled();
});

it('oferece "Carregar mais" quando há mais páginas', () => {
  const onLoadMore = jest.fn();
  const { rerender } = render(<MediaGrid items={items} hasMore onLoadMore={onLoadMore} />);
  fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }));
  expect(onLoadMore).toHaveBeenCalled();

  rerender(<MediaGrid items={items} hasMore={false} onLoadMore={onLoadMore} />);
  expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument();
});

it('EmptyState mostra título, descrição e ação', () => {
  render(<EmptyState title="Sua lista está vazia" description="Salve algo" action={<button>Explorar</button>} />);
  expect(screen.getByRole('heading', { name: 'Sua lista está vazia' })).toBeInTheDocument();
  expect(screen.getByText('Salve algo')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Explorar' })).toBeInTheDocument();
});
