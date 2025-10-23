export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0f1724 0%, #1a2332 100%)',
      borderTop: '1px solid #2a3441',
      padding: '32px 0',
      marginTop: '48px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🎞
          </div>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#e6eef8' 
          }}>
            CineExplorer
          </span>
        </div>
        
        <p style={{ 
          color: '#94a3b8', 
          margin: 0, 
          fontSize: '14px',
          textAlign: 'center'
        }}>
          © {new Date().getFullYear()} CineExplorer. Todos os direitos reservados.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <a 
            href="/privacy" 
            style={{ 
              color: '#94a3b8', 
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e6eef8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Política de Privacidade
          </a>
          <span style={{ color: '#3a4553' }}>•</span>
          <a 
            href="/terms" 
            style={{ 
              color: '#94a3b8', 
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e6eef8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Termos de Serviço
          </a>
          <span style={{ color: '#3a4553' }}>•</span>
          <a 
            href="/contact" 
            style={{ 
              color: '#94a3b8', 
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e6eef8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Contato
          </a>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          marginTop: '8px'
        }}>
          <span style={{ 
            fontSize: '12px', 
            color: '#64748b',
            textAlign: 'center'
          }}>
            Feito com ❤️ para amantes de cinema e séries
          </span>
        </div>
      </div>
    </footer>
  );
}