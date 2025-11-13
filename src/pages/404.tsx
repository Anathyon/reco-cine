import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h1 style={{ fontSize: '6rem', fontWeight: 'bold', margin: 0, color: '#3b82f6' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', margin: '1rem 0', color: '#e2e8f0' }}>Página não encontrada</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          A página que você está procurando não existe.
        </p>
        <Link href="/" style={{ 
          background: '#3b82f6', 
          color: 'white', 
          padding: '0.75rem 1.5rem', 
          borderRadius: '0.5rem',
          textDecoration: 'none',
          display: 'inline-block'
        }}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}